-- pgvector-backed chunk store for cite-or-silence.
create extension if not exists vector;

create table if not exists public.chunks (
  id        text primary key,
  source    text not null,
  heading   text not null,
  text      text not null,
  embedding vector(1536) not null
);

create index if not exists chunks_embedding_idx
  on public.chunks using hnsw (embedding vector_cosine_ops);

-- Only the service role (server side) reads or writes chunks.
alter table public.chunks enable row level security;

create or replace function public.match_chunks(query_embedding vector(1536), match_count int)
returns table (id text, source text, heading text, text text, score float)
language sql stable
as $$
  select c.id, c.source, c.heading, c.text, 1 - (c.embedding <=> query_embedding) as score
  from public.chunks c
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
