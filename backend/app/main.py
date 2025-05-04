# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware

# Import all routers
from app.routers import categories, authors, books, auth, orders, reviews, carts # Add reviews router

# Import oauth2_scheme from auth module
from app.routers.auth import oauth2_scheme

app = FastAPI(
    title="Bookworm API",
    description="API for the Bookworm bookstore application",
    version="1.0.0"
)

# Define CORS origins
origins = [
    "http://localhost:3000",  # Default React dev server port
    "http://localhost:5173",  # Default Vite dev server port
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom OpenAPI schema setup
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Bookworm API",
        version="1.0.0",
        description="API for the Bookworm bookstore application",
        routes=app.routes,
    )
    
    # Define the security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer Auth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token in the format: Bearer <token>"
        }
    }
    
    # Apply security globally
    openapi_schema["security"] = [{"Bearer Auth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Include routers with security
app.include_router(auth.router, tags=["Authentication"])
app.include_router(
    orders.router,
    prefix="",
    tags=["Orders"],
    dependencies=[Depends(oauth2_scheme)]
)
app.include_router(categories.router, tags=["Categories"])
app.include_router(
    reviews.router,
    tags=["Reviews"]
)
app.include_router(authors.router, tags=["Authors"])
app.include_router(books.router, tags=["Books"])
app.include_router(carts.router, tags=["cart"], prefix="/api")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Bookworm Backend!"} # Updated message

# Run command: uvicorn main:app --reload --port 8000 --app-dir backend
# Note the --app-dir backend which helps with imports if main.py is in the root
# If main.py is inside app/, run: uvicorn app.main:app --reload --port 8000
