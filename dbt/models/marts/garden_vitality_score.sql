with plant_hp as (
    select * from {{ ref('plant_hp') }}
),

vitality as (
    select
        current_date                                                    as snapshot_date,
        count(*)                                                        as plant_count,
        round(avg(hp), 1)                                               as vitality_score,
        count(*) filter (where status = 'Thriving')                     as plants_ok,
        count(*) filter (where status = 'Struggling')                   as plants_warning,
        count(*) filter (where status = 'Lost')                         as plants_lost
    from plant_hp
)

select * from vitality
