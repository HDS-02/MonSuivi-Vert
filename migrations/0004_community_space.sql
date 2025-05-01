-- Renommer les tables du forum en tables de l'espace communautaire
ALTER TABLE forum_posts RENAME TO community_posts;
ALTER TABLE forum_comments RENAME TO community_comments;
ALTER TABLE forum_votes RENAME TO community_votes;

-- Mettre à jour les contraintes de clé étrangère
ALTER TABLE community_comments 
  DROP CONSTRAINT forum_comments_post_id_fkey,
  ADD CONSTRAINT community_comments_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES community_posts(id);

ALTER TABLE community_votes 
  DROP CONSTRAINT forum_votes_post_id_fkey,
  ADD CONSTRAINT community_votes_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES community_posts(id);

-- Ajouter de nouvelles colonnes pour l'espace communautaire
ALTER TABLE community_posts 
  ADD COLUMN status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN reports INTEGER DEFAULT 0;

ALTER TABLE community_comments 
  ADD COLUMN status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN likes INTEGER DEFAULT 0,
  ADD COLUMN dislikes INTEGER DEFAULT 0;

-- Mettre à jour les catégories
ALTER TABLE community_posts 
  ALTER COLUMN category TYPE VARCHAR(50) USING 
    CASE category
      WHEN 'conseils' THEN 'conseils'
      WHEN 'questions' THEN 'questions'
      WHEN 'partage' THEN 'experiences'
      WHEN 'identification' THEN 'astuces'
      WHEN 'maladies' THEN 'conseils'
      ELSE 'conseils'
    END; 