from backend.routes.live_chat import get_shop_context, get_db

db = next(get_db())
context = get_shop_context(db)
print("--- SHOP CONTEXT START ---")
print(context)
print("--- SHOP CONTEXT END ---")
