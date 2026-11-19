CREATE DATABASE IF NOT EXISTS pharmaflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmaflow_db;

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS segments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  pack_info VARCHAR(120) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  unit_label VARCHAR(50) DEFAULT 'per Box',
  is_new TINYINT(1) DEFAULT 0,
  image_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS product_segments (
  product_id INT NOT NULL,
  segment_id INT NOT NULL,
  PRIMARY KEY (product_id, segment_id),
  CONSTRAINT fk_ps_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_segment FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS downloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_format VARCHAR(20) NOT NULL,
  file_size_label VARCHAR(30) NOT NULL,
  download_count INT DEFAULT 0,
  is_sample TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'employee', 'store') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_type ENUM('contact', 'custom_card', 'visiting_card') DEFAULT 'contact',
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Companies
INSERT IGNORE INTO companies (name, slug) VALUES
('Trumac Healthcare', 'trumac-healthcare'),
('Camrut Pharma', 'camrut-pharma'),
('Medisync Pharma', 'medisync-pharma'),
('Cialto Drugs', 'cialto-drugs'),
('Pythus Pharma', 'pythus-pharma');

-- Sample Segments
INSERT IGNORE INTO segments (name, slug) VALUES
('Cardiac', 'cardiac'),
('Diabetic', 'diabetic'),
('Derma', 'derma'),
('Paediatric', 'paediatric'),
('Gynae', 'gynae'),
('Ortho', 'ortho'),
('Ophthalmic', 'ophthalmic'),
('Injectable', 'injectable'),
('ENT', 'ent'),
('Herbal', 'herbal'),
('Dental', 'dental'),
('Urology', 'urology'),
('Nephro', 'nephro'),
('Neuro', 'neuro');

-- Sample Download Items (Local sample files)
INSERT IGNORE INTO downloads (id, title, description, category, file_path, file_format, file_size_label, download_count, is_sample) VALUES
(1, 'Sample Price List - Core Divisions (Demo)', 'Clearly marked local sample price list document for testing downloads.', 'Price Lists', 'sample_price_list.txt', 'TXT', '1 KB', 0, 1),
(2, 'Sample Visual Aid Brochure (Demo)', 'Local sample visual aid summary file for testing category filter and download flow.', 'Visual Aids', 'sample_visual_aid.txt', 'TXT', '1 KB', 0, 1),
(3, 'Sample Product Catalog Sheet (Demo)', 'Local sample catalog sheet for testing search and download counter updates.', 'Catalogs', 'sample_catalog.txt', 'TXT', '1 KB', 0, 1);