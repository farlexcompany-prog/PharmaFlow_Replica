USE pharmaflow_db;

DROP TABLE IF EXISTS claims_gifts;

CREATE TABLE claims_gifts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ledger_name VARCHAR(180) NOT NULL,
  party_code VARCHAR(80) NOT NULL,
  contact_no VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  selected_gift VARCHAR(220) NOT NULL,
  points INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_party_code (party_code),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DESCRIBE claims_gifts;
