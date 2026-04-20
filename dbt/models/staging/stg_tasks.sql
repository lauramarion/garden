with source as (
    select * from {{ source('garden', 'tasks') }}
),

renamed as (
    select
        id              as task_id,
        plant_id,
        zone_id,
        title,
        description,
        priority,
        status,
        source          as task_source,
        due_date,
        completed_at,
        created_at
    from source
)

select * from renamed
