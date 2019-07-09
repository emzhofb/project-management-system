-- create database pms.db
CREATE DATABASE "pms.db"
  WITH 
  OWNER = postgres
  ENCODING = 'UTF8'
  CONNECTION LIMIT = -1;

-- create table users
CREATE TABLE public.users
(
  userid serial NOT NULL,
  email character varying(50) NOT NULL,
  password character varying(50) NOT NULL,
  firstname character varying(50),
  lastname character varying(50),
  PRIMARY KEY (userid)
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.users
  OWNER to postgres;