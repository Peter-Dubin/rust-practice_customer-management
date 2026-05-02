use rocket::{http::Status, serde::json::Json, State};

use crate::db::Db;
use crate::models::{CreateCustomerRequest, CustomerQuery, UpdateCustomerRequest};

#[get("/customers?<query..>")]
pub fn list_customers(
    db: &State<Db>,
    query: CustomerQuery,
) -> Result<Json<serde_json::Value>, Status> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).clamp(1, 100);

    db.list_customers(
        page,
        per_page,
        query.name_filter.as_deref(),
        query.order_by.as_deref(),
        query.order_direction.as_deref(),
    )
    .map(|r| Json(serde_json::to_value(r).unwrap()))
    .map_err(|_| Status::InternalServerError)
}

#[get("/customers/<id>")]
pub fn get_customer(db: &State<Db>, id: &str) -> Result<Json<serde_json::Value>, Status> {
    match db.get_customer(id) {
        Ok(Some(c)) => Ok(Json(serde_json::to_value(c).unwrap())),
        Ok(None) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[post("/customers", format = "json", data = "<req>")]
pub fn create_customer(
    db: &State<Db>,
    req: Json<CreateCustomerRequest>,
) -> Result<Json<serde_json::Value>, Status> {
    db.create_customer(&req.into_inner())
        .map(|c| Json(serde_json::to_value(c).unwrap()))
        .map_err(|_| Status::InternalServerError)
}

#[put("/customers/<id>", format = "json", data = "<req>")]
pub fn update_customer(
    db: &State<Db>,
    id: &str,
    req: Json<UpdateCustomerRequest>,
) -> Result<Json<serde_json::Value>, Status> {
    match db.update_customer(id, &req.into_inner()) {
        Ok(true) => Ok(Json(serde_json::json!({"message": "updated"}))),
        Ok(false) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[delete("/customers/<id>")]
pub fn delete_customer(db: &State<Db>, id: &str) -> Result<Json<serde_json::Value>, Status> {
    match db.delete_customer(id) {
        Ok(true) => Ok(Json(serde_json::json!({"message": "deleted"}))),
        Ok(false) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}
