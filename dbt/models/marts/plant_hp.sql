with plants as (
    select * from {{ ref('stg_plants') }}
),

last_action as (
    select
        plant_id,
        max(entry_date)                                         as last_action_date,
        count(*) filter (where entry_type = 'action')          as action_count
    from {{ ref('stg_journal_entries') }}
    group by plant_id
),

hp_calc as (
    select
        p.plant_id,
        p.code,
        p.common_name,
        p.zone_id,
        p.status,
        la.last_action_date,
        coalesce(la.action_count, 0)                           as action_count,

        -- HP v1: driven by status; care history will refine this in a future version
        case
            when p.status = 'OK'      then 80
            when p.status = 'WARNING' then 35
            else 5
        end                                                    as hp

    from plants p
    left join last_action la on la.plant_id = p.plant_id
)

select * from hp_calc
