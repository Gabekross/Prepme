-- ============================================================================
-- Marketing Hub: make existing generated channel asset blog links absolute
-- ============================================================================
--
-- Social/newsletter assets must use public absolute URLs. Earlier generated
-- assets could contain relative paths such as "/blog/servant-leadership", which
-- do not become clickable when copied to external platforms.

UPDATE content_assets
SET
  body = regexp_replace(
    body,
    $re$(^|[[:space:]\(\[\{"'`])\/blog\/([a-z0-9-]+)$re$,
    $rep$\1https://www.pmpmasterylab.com/blog/\2$rep$,
    'gi'
  ),
  updated_at = now()
WHERE body ~* $re$(^|[[:space:]\(\[\{"'`])\/blog\/[a-z0-9-]+$re$;
