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
  firstname character varying(25),
  lastname character varying(25),
  PRIMARY KEY (userid),
  UNIQUE (email)
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.users
  OWNER to postgres;

-- create table projects
CREATE TABLE public.projects
(
  projectid serial NOT NULL,
  name character varying(50) NOT NULL,
  PRIMARY KEY (projectid)
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.projects
  OWNER to postgres;

-- create table members
CREATE TABLE public.members
(
  id serial NOT NULL,
  userid integer,
  role character varying(20),
  projectid integer,
  PRIMARY KEY (id),
  CONSTRAINT userforeignkey FOREIGN KEY (userid)
    REFERENCES public.users (userid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT projectforeignkey FOREIGN KEY (projectid)
    REFERENCES public.projects (projectid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.members
  OWNER to postgres;
