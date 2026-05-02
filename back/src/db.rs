use rusqlite::{params, Connection, Result};
use std::sync::Mutex;

use crate::models::{
    CreateCustomerRequest, Customer, PaginatedResponse, UpdateCustomerRequest,
};

pub struct Db(pub Mutex<Connection>);

impl Db {
    pub fn open(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Db(Mutex::new(conn)))
    }

    pub fn list_customers(
        &self,
        page: i64,
        per_page: i64,
        name_filter: Option<&str>,
        order_by: Option<&str>,
        order_direction: Option<&str>,
    ) -> Result<PaginatedResponse<Customer>> {
        let conn = self.0.lock().unwrap();
        let offset = (page - 1) * per_page;

        let allowed_columns = ["CompanyName", "ContactName", "City", "Country", "CustomerID"];
        let order_col = order_by
            .filter(|c| allowed_columns.contains(c))
            .unwrap_or("CompanyName");
        let order_dir = match order_direction {
            Some(d) if d.to_uppercase() == "DESC" => "DESC",
            _ => "ASC",
        };

        let filter_val = name_filter.map(|f| format!("%{}%", f));

        let (count_sql, list_sql) = if filter_val.is_some() {
            (
                "SELECT COUNT(*) FROM Customers WHERE CompanyName LIKE ?1".to_string(),
                format!(
                    "SELECT CustomerID, CompanyName, ContactName, ContactTitle, \
                     Address, City, Region, PostalCode, Country, Phone, Fax \
                     FROM Customers WHERE CompanyName LIKE ?1 \
                     ORDER BY {} {} LIMIT ?2 OFFSET ?3",
                    order_col, order_dir
                ),
            )
        } else {
            (
                "SELECT COUNT(*) FROM Customers".to_string(),
                format!(
                    "SELECT CustomerID, CompanyName, ContactName, ContactTitle, \
                     Address, City, Region, PostalCode, Country, Phone, Fax \
                     FROM Customers ORDER BY {} {} LIMIT ?1 OFFSET ?2",
                    order_col, order_dir
                ),
            )
        };

        let total: i64 = if let Some(ref fv) = filter_val {
            conn.query_row(&count_sql, params![fv], |r| r.get(0))?
        } else {
            conn.query_row(&count_sql, [], |r| r.get(0))?
        };

        let mut stmt = conn.prepare(&list_sql)?;
        let map_row = |r: &rusqlite::Row| -> rusqlite::Result<Customer> {
            Ok(Customer {
                customer_id: r.get(0)?,
                company_name: r.get(1)?,
                contact_name: r.get(2)?,
                contact_title: r.get(3)?,
                address: r.get(4)?,
                city: r.get(5)?,
                region: r.get(6)?,
                postal_code: r.get(7)?,
                country: r.get(8)?,
                phone: r.get(9)?,
                fax: r.get(10)?,
            })
        };

        let customers: Vec<Customer> = if let Some(ref fv) = filter_val {
            stmt.query_map(params![fv, per_page, offset], map_row)?
                .collect::<Result<Vec<_>>>()?
        } else {
            stmt.query_map(params![per_page, offset], map_row)?
                .collect::<Result<Vec<_>>>()?
        };

        Ok(PaginatedResponse {
            data: customers,
            total,
            page,
            per_page,
        })
    }

    pub fn get_customer(&self, id: &str) -> Result<Option<Customer>> {
        let conn = self.0.lock().unwrap();
        let sql = "SELECT CustomerID, CompanyName, ContactName, ContactTitle, \
                   Address, City, Region, PostalCode, Country, Phone, Fax \
                   FROM Customers WHERE CustomerID = ?1";
        let result = conn.query_row(sql, params![id], |r| {
            Ok(Customer {
                customer_id: r.get(0)?,
                company_name: r.get(1)?,
                contact_name: r.get(2)?,
                contact_title: r.get(3)?,
                address: r.get(4)?,
                city: r.get(5)?,
                region: r.get(6)?,
                postal_code: r.get(7)?,
                country: r.get(8)?,
                phone: r.get(9)?,
                fax: r.get(10)?,
            })
        });
        match result {
            Ok(c) => Ok(Some(c)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn create_customer(&self, req: &CreateCustomerRequest) -> Result<Customer> {
        let conn = self.0.lock().unwrap();
        conn.execute(
            "INSERT INTO Customers \
             (CustomerID, CompanyName, ContactName, ContactTitle, \
              Address, City, Region, PostalCode, Country, Phone, Fax) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                req.customer_id,
                req.company_name,
                req.contact_name,
                req.contact_title,
                req.address,
                req.city,
                req.region,
                req.postal_code,
                req.country,
                req.phone,
                req.fax
            ],
        )?;
        Ok(Customer {
            customer_id: req.customer_id.clone(),
            company_name: req.company_name.clone(),
            contact_name: req.contact_name.clone(),
            contact_title: req.contact_title.clone(),
            address: req.address.clone(),
            city: req.city.clone(),
            region: req.region.clone(),
            postal_code: req.postal_code.clone(),
            country: req.country.clone(),
            phone: req.phone.clone(),
            fax: req.fax.clone(),
        })
    }

    pub fn update_customer(&self, id: &str, req: &UpdateCustomerRequest) -> Result<bool> {
        let conn = self.0.lock().unwrap();
        let rows = conn.execute(
            "UPDATE Customers SET \
             CompanyName=?1, ContactName=?2, ContactTitle=?3, Address=?4, \
             City=?5, Region=?6, PostalCode=?7, Country=?8, Phone=?9, Fax=?10 \
             WHERE CustomerID=?11",
            params![
                req.company_name,
                req.contact_name,
                req.contact_title,
                req.address,
                req.city,
                req.region,
                req.postal_code,
                req.country,
                req.phone,
                req.fax,
                id
            ],
        )?;
        Ok(rows > 0)
    }

    pub fn delete_customer(&self, id: &str) -> Result<bool> {
        let conn = self.0.lock().unwrap();
        let rows = conn.execute(
            "DELETE FROM Customers WHERE CustomerID = ?1",
            params![id],
        )?;
        Ok(rows > 0)
    }
}
