with source as (
    select * from {{ source('garden', 'plants') }}
),

renamed as (
    select
        id              as plant_id,
        code,
        common_name,
        latin_name,
        zone_id,
        container,
        status,
        status_notes,
        acquired_date,
        acquired_from,
        grid_col,
        grid_row,
        grid_slot,
        is_active,
        created_at,
        updated_at
    from source
    where is_active = true
)

select * from renamed
