import os
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

SYSTEM_PROMPT = """
You are a smart, friendly, and efficient Kirana (Grocery) Shop Assistant.
Your goal is to help the shopkeeper manage their inventory and sales using natural language.

**Database Schema:**
- `products` (id, name, category, price, stock, shelf_position)
- `sales` (id, product_id, quantity, total_amount, timestamp)

**Your Capabilities:**
1.  **Answer Questions**: Provide helpful answers about the shop's data.
2.  **Execute Actions**: Generate SQL to update stock or record sales.
3.  **Be Conversational**: If the user says "Hi" or "Thanks", reply naturally.

**Rules for SQL Generation:**
- **Read Data**: Use `SELECT`. Example: "How much rice?" -> `SELECT name, stock FROM products WHERE name LIKE '%rice%'`
- **Record Sale**: Use `INSERT` into `sales` AND `UPDATE` `products`. **ALWAYS** follow with a `SELECT` to check the new stock.
    - Example: "Sold 2 milk" ->
      `INSERT INTO sales ...; UPDATE products SET stock = stock - 2 WHERE name LIKE '%milk%'; SELECT name, stock FROM products WHERE name LIKE '%milk%';`
- **Restock**: Use `UPDATE`. **ALWAYS** follow with a `SELECT` to check the new stock.
    - Example: "Added 10 sugar" -> `UPDATE products SET stock = stock + 10 WHERE name LIKE '%sugar%'; SELECT name, stock FROM products WHERE name LIKE '%sugar%';`

**Response Format:**
- If the user asks a general question (e.g., "Hello"), reply with `ANSWER: [Your friendly response]`.
- If the user asks for data or an action, reply ONLY with the SQL query (prefix `SQL:` is optional but helpful).
- **CRITICAL**: Do not explain the SQL. Just output the SQL.
- **CRITICAL**: You MUST reply in the SAME language as the user's input. If they speak Hindi, reply in Hindi. If Telugu, reply in Telugu.
"""

model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=SYSTEM_PROMPT)

async def process_chat_message(message: str, db: Session, history: list = []):
    if not api_key:
        raise Exception("Gemini API key not configured")

    # Convert history to Gemini format
    gemini_history = []
    for msg in history:
        role = "user" if msg.get("role") == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg.get("content")]})

    chat_session = model.start_chat(history=gemini_history)
    prompt = f"User: {message}\n"

    try:
        response = chat_session.send_message(prompt)
        text_response = response.text.strip()

        if text_response.startswith("ANSWER:"):
            return {"response": text_response.replace("ANSWER:", "").strip(), "sql_query": None}

        # Remove markdown code blocks if present
        if "```" in text_response:
            text_response = text_response.replace("```sql", "").replace("```", "").strip()

        # Remove "SQL:" prefix if present
        if text_response.upper().startswith("SQL:"):
            text_response = text_response[4:].strip()

        # Check if it's a SQL query
        if any(text_response.upper().startswith(kw) for kw in ["SELECT", "INSERT", "UPDATE", "DELETE"]):
            try:
                queries = [q.strip() for q in text_response.split(';') if q.strip()]
                data_str = ""
                changes_made = False
                
                for query in queries:
                    result = db.execute(text(query))
                    
                    if query.upper().startswith("SELECT"):
                        rows = result.fetchall()
                        if rows:
                            data_str += f"Query: {query}\nResult:\n"
                            for row in rows:
                                data_str += str(row) + "\n"
                        else:
                            data_str += f"Query: {query}\nResult: No data found.\n\n"
                    else:
                        # INSERT/UPDATE/DELETE
                        if result.rowcount > 0:
                            changes_made = True
                            
                if changes_made:
                    db.commit()
                
                # Generate final natural language response
                answer_prompt = f"""
                User Question: {message}
                SQL Queries Executed: {text_response}
                Data Retrieved:
                {data_str}
                Changes Made: {changes_made}
                
                Instructions:
                1. Answer the user's question naturally based on the Data Retrieved.
                2. If 'Changes Made' is True, confirm the action was successful.
                3. **CRITICAL**: If you have data about remaining stock, YOU MUST mention it. (e.g., "Sold 2 milk. Remaining stock: 8").
                4. **CRITICAL**: Do NOT show any SQL code or technical terms.
                5. **CRITICAL**: Do NOT use "ANSWER:" prefix.
                6. **CRITICAL**: Reply in the SAME language as the user's question (Hindi/Telugu/English).
                7. Format lists as Markdown tables.
                """
                
                final_response = chat_session.send_message(answer_prompt)
                return {"response": final_response.text.strip(), "sql_query": text_response}

            except Exception as e:
                db.rollback()
                return {"response": f"I couldn't complete that request. Error: {str(e)}", "sql_query": text_response}

        return {"response": text_response, "sql_query": None}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e
