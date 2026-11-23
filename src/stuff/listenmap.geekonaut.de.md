---
title: "listenmap.geekonaut.de"
category: "Web app"
year: 2026
order: 2
externalUrl: "https://listenmap.geekonaut.de"
repoUrl: "https://github.com/AVGP/teal-heatmap"
stack:
  - "golang"
  - "Postgres"
  - "atproto"
  - "docker"
summary: "A webapp that lets you either upload your spotify listening history or connect with your Teal.fm account to get a github-style heatmap"
---

This app produces a github-style heatmap of your listening history. It either uses your [teal.fm](https://teal.fm) data or you can upload the ZIP file of the Spotify listening history.
You can download the Spotify listening history via [the privacy page of your account](https://www.spotify.com/de-en/account/privacy/) under "Extended Listening History".

It will send you a download link via email and that'll give you a ZIP fill full of JSON files. You can just upload the ZIP file here and get the heatmap for your own account.

The heatmap is ordered by year and you can see the top artists, top albums and top songs for each year. You can also click on each day and see the listening history for that day.

[Try it out here](https://listenmap.geekonaut.de)
