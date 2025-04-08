Notes:

[ ] we need to add a 'NEXT_PUBLIC_BASE_URL' when we have one or else the template file routing won't work
[ ] project limit is env var stored in .env.local: NEXT_PUBLIC_PROJECT_LIMIT=2
[ ] env vars need an anthropic api key

**Auth**
[ ] emails aren't validated - reason is because we store info in localStorage about the questionnaire and if user has to click on a validation link in their email, they'll have to fill in their details again. This could be fixed by saving data in url params but will worry about it later

**Optimisation**
[ ] While site is generating, we should add loading states relevant to where the generation is at
[ ] While images are loading in the 'Visual Style' and you navigate away, they stop uploading
[ ] Preview image not displaying correctly on profile page
[ ] Rate limiting
