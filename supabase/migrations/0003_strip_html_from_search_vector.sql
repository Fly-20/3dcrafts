-- The product description field became a rich-text (HTML) field after 0001 was
-- written. search_vector indexed the raw description, so tag names ("strong",
-- "em", "ul", "li"...) were being indexed as if they were real words. Strip
-- tags before feeding text into to_tsvector.
drop index if exists products_search_vector_idx;
alter table products drop column if exists search_vector;

alter table products add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(regexp_replace(description, '<[^>]+>', ' ', 'g'), '')), 'B')
) stored;

create index products_search_vector_idx on products using gin (search_vector);
