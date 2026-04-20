with source as (
    select * from {{ source('garden', 'journal_entries') }}
),

renamed as (
    select
        id          as entry_id,
        entry_date,
        plant_id,
        zone_id,
        entry_type,
        details,
        result,
        created_at
    from source
)

select * from renamed
