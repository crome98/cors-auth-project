create table users (
	first_name varchar(20) not null,
	last_name  varchar(20) not null,
	email 	   varchar(20) not null primary key,
	password   varchar(50) not null,
	token      varchar(50) not null
);
