drop table if exists player;
create table player (
    id integer primary key autoincrement,
    name text not null,
    rank integer not null,
    pos text not null,
    team text not null,
    adp float not null,
    bye integer not null,
    age integer not null,
    exp text not null,
    taken boolean not null default 0
);
