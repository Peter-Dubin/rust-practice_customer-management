#[macro_use]
extern crate rocket;

mod db;
mod models;
mod routes;

use db::Db;
use rocket_cors::{AllowedOrigins, CorsOptions};

#[launch]
fn rocket() -> _ {
    let db = Db::open("northwind.db").expect("Failed to open northwind.db");

    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::all())
        .to_cors()
        .expect("CORS configuration error");

    rocket::build()
        .manage(db)
        .attach(cors)
        .mount(
            "/",
            routes![
                routes::list_customers,
                routes::get_customer,
                routes::create_customer,
                routes::update_customer,
                routes::delete_customer,
                routes::list_suppliers,
                routes::get_supplier,
                routes::create_supplier,
                routes::update_supplier,
                routes::delete_supplier,
            ],
        )
}
