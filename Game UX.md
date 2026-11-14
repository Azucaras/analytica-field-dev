# Game UX 

## Gemini Research

**User:** wild rift ux

**Response:**

*[League of Legends: Wild Rift](https://www.google.com/search?kgmid=%2Fg%2F11j0q35sms&q=League+of+Legends%3A+Wild+Rift)* translates the complex, multi-system desktop experience of *League of Legends* into a streamlined mobile and console interface. Its User Experience (UX) and User Interface (UI) design focuses on touch responsiveness, readable mobile hierarchy, and reduced cognitive load during fast-paced matches. [[1](https://www.reddit.com/r/leagueoflegends/comments/1ry2hyv/the_uiux_experience_is_horrible_compared_to_wild/), [2](https://ui.adsabs.harvard.edu/abs/2023AIPC.2665c0014R/abstract), [3](https://www.researchgate.net/publication/374174191_User_experience_analysis_in_mobile_League_of_Legends_wild_rift_game_using_cognitive_walkthrough_method)]

Key UX/UI Pillars in Wild Rift

- **Simplified In-Game HUD:** The mobile screen keeps primary thumb zones clear for movement (virtual left joystick) and ability casting (right-side buttons), while keeping vital info like health, mana, and spell cooldowns anchored in peripheral corners.
- **Around-Game Systems:** The lobby, store, loadouts, and event passes are consolidated into a clean, dark-themed dashboard that minimizes deep menu-diving compared to the PC client.
- **Smart-Targeting and Assists:** Auto-targeting, camera panning adjustments, and custom button layouts help bridge the accuracy gap of playing a full MOBA on a touchscreen.
- **Onboarding & Pacing:** Shorter match durations (~15–20 minutes) and accelerated gold/XP economy loops are reflected directly in how item shops and scoreboard notifications pop up and prompt the player. [[1](https://www.youtube.com/watch?v=gX_LNeBbcZM&t=483), [2](https://www.behance.net/gallery/239199519/LOL-Wild-rift-build-guides-UI-dashboard), [3](https://ui.adsabs.harvard.edu/abs/2023AIPC.2665c0014R/abstract)]

See how players customize essential in-game controls and layout settings for an optimal Wild Rift mobile experience:

If you'd like to dive deeper, let me know:

- Are you analyzing a **specific UI screen** (like the shop or post-game lobby)?
- Are you working on a **UX case study** or redesign concept?

I can provide more targeted breakdowns or design heuristics.

**User:** I want to make a UX case study for it because I want to use that for an application that I'm building that requires multiple controls, which is similar to a game interface, which is why I want to study wild rift UX so I can use similar concepts in my app (it is an agent that helps farmers with satellite data)

**Response:**

An agriculture agent app using satellite data actually shares massive overlap with a MOBA like *Wild Rift*. Both environments require the user to **manage a high-density, real-time map ("the fog of war") while executing contextual actions (micro-management) based on macro alerts.**

By treating fields as "lanes," satellite anomalies as "enemies," and farm actions as "abilities," you can port gaming UX patterns to prevent data fatigue for farmers.

------

The UX Translation: *Wild Rift* to AgTech

| *Wild Rift* Mechanic           | AgTech Application (Farmers + Satellite Data) | UX Benefit                                                   |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------ |
| **The Minimap & Pings**        | **Macro Farm View & Anomaly Alerts**          | Gives an instant, high-level health status of all fields without forcing the user to zoom into each individual acre. |
| **Dual-Joystick Controls**     | **Map Panning + Property Selection**          | Left thumb navigates the spatial layout (GIS map), while the right thumb cycles through active layers (NDVI, soil moisture, radar). |
| **Smart Targeting (Auto-Aim)** | **Contextual Feature Snapping**               | Pressing an action button automatically snaps the camera to the nearest field requiring immediate attention (e.g., pest outbreak). |
| **Action / Ability Wheel**     | **Radial Field Interventions**                | Holding down a field zone opens a gesture-based wheel to quickly log actions (e.g., "Schedule Irrigation", "Deploy Drone", "Flag Scout"). |
| **Item Shop Quick-Buy**        | **Dynamic Recommendation Banner**             | Contextual "one-tap" buttons pop up on the HUD when certain conditions are met (e.g., *“NDVI dropped 15%. Order fertilizer prescription?”*). |

------

Key Design Patterns to Adapt

1. Thumb-Zone Hierarchy (The HUD)

Farmers operate in the field, often holding a mobile device with one hand or using gloves.

- **The Gaming Pattern:** *Wild Rift* keeps the center of the screen completely clear for spatial awareness, clustering actions heavily in the bottom-right and navigation in the bottom-left.
- **Your App:** Keep the satellite map imagery dead center. Do not overlay menus in the middle. Place heavy multi-control switches (toggling NDVI, Radar, Thermal layers) in a tight arc on the bottom right, easy for a single thumb to tap through.
- Radial Menus for Spatial Actions

- **The Gaming Pattern:** In *Wild Rift*, dragging the "Ping" button opens a wheel to select *Danger, On My Way, or Assist*.
- **Your App:** When a farmer taps and holds on a specific grid or anomaly on the satellite map, drop a radial wheel around their thumb. Swiping up could mean "Navigate to this point", swiping right "Mark as infested", and swiping left "View historical moisture data". This eliminates the need for deep, nested text menus.
- Progressive Disclosure & "Combat Alerts"

- **The Gaming Pattern:** You don't see an enemy's item build unless you open the scoreboard. You only see their health bar and position.
- **Your App:** Avoid showing raw telemetry, multi-spectral index numbers, and complex legends on the main screen. Use color-coded health bars over fields. If a satellite pass detects an issue, flash an urgent, clear visual icon (like a champion kill alert) at the top of the interface: **"Field 3: Moisture Drop Detected."** Tapping it immediately pans the camera and filters the controls to fix *that specific issue*.

------

Case Study Structure Framework

If you are writing this case study to document your design process, structure it around **Cognitive Load Reduction**. Here is a punchy outline you can use:

1. **The Parallel Challenge:** High-stakes spatial data management in mobile environments (Gamers vs. Farmers).
2. **Control Mapping:** Deconstructing *Wild Rift’s* multi-control HUD and mapping virtual joysticks/action wheels to GIS layer toggles and field logging.
3. **Information Architecture Hierarchy:** How to use gaming-inspired "Heads-Up Displays" to keep raw data hidden until it is contextually relevant.
4. **The Prototype:** Showing your app's wireframes side-by-side with *Wild Rift* screenshots to prove how gesture-based gaming UI speeds up a farmer's daily workflow.

Would you like to map out the **exact layout grid / wireframe** for your main map screen next, or should we focus on designing the **radial gesture wheel** for the farmer's actions?

**User:** this is great. I actually want to know if there are studies about Wild Rift UX in the web, so I can research further

**Response:**

Several formal studies, design breakdowns, and developer diaries examine *[Wild Rift](https://www.google.com/search?kgmid=%2Fg%2F11j0q35sms&q=Wild+Rift)’s* UX architecture. These primary resources will help ground your case study with existing industry research:

1. Formal Academic Research

- **The Study:** *User Experience Analysis in Mobile League of Legends: Wild Rift Game Using Cognitive Walkthrough Method* (Published on [ResearchGate](https://www.researchgate.net/publication/374174191_User_experience_analysis_in_mobile_League_of_Legends_wild_rift_game_using_cognitive_walkthrough_method)). [[1](https://www.researchgate.net/publication/374174191_User_experience_analysis_in_mobile_League_of_Legends_wild_rift_game_using_cognitive_walkthrough_method)]
- **What it covers:** This study specifically measures user friction and cognitive load for mobile players. It utilizes a "cognitive walkthrough" to map out where players experience usability drops due to difficult-to-understand displays, text, and icons during intense gameplay sessions. [[1](https://www.researchgate.net/publication/374174191_User_experience_analysis_in_mobile_League_of_Legends_wild_rift_game_using_cognitive_walkthrough_method)]
- **Why it helps your AgTech app:** It analyzes exactly how much visual information a user can process before experiencing performance drop-offs—perfect for defending why you choose to hide raw satellite metadata behind simplified visual icons.
- Official Riot Games Developer Insights

- **The Resource:** */dev: Behind Wild Rift Events* on the [Official Wild Rift News Portal](https://wildrift.leagueoflegends.com/en-us/news/dev/dev-behind-wild-rift-events/). [[1](https://wildrift.leagueoflegends.com/en-us/news/dev/dev-behind-wild-rift-events/)]
- **What it covers:** Riot’s internal UX design team shares their step-by-step pipeline. They explicitly break down how they use **low-fidelity UX wireframes with placeholder assets** to map out complex player journeys before handing them off to visual UI designers. [[1](https://wildrift.leagueoflegends.com/en-gb/news/dev/dev-behind-wild-rift-events/), [2](https://wildrift.leagueoflegends.com/en-us/news/dev/dev-behind-wild-rift-events/)]
- **Why it helps your AgTech app:** This gives you a verified structural blueprint of how professional games design complex user flows from intent to interface execution. [[1](https://wildrift.leagueoflegends.com/en-gb/news/dev/dev-behind-wild-rift-events/), [2](https://wildrift.leagueoflegends.com/en-us/news/dev/dev-behind-wild-rift-events/)]
- Comprehensive UX UI Galleries & Layout Breakdowns

- **The Resource:** The Interface In Game Wild Rift Catalog.
- **What it covers:** This database acts as a complete visual breakdown of every single UI screen within the game. It explicitly isolates the asset groupings—such as **in-game overlays, HUD settings, map controls, and scoreboard menus**.
- **Why it helps your AgTech app:** Instead of spending hours playing the game to grab screenshots, you can pull clean, high-resolution references of their menu states to place side-by-side with your agriculture mockups. [[1](https://interfaceingame.com/games/league-of-legends-wild-rift/)]
- Market Competitor & Control Deconstructions

- **The Resource:** The *League of Legends: Wild Rift Soft Launch Deconstruction* by [GameRefinery](https://www.gamerefinery.com/league-of-legends-wild-rift-soft-launch-deconstruction-competitor-analysis/).
- **What it covers:** An industry-standard teardown analyzing how *Wild Rift* customized mobile mechanics to ensure shorter, high-impact sessions (~15 minutes) compared to its 40-minute PC counterpart, specifically contrasting its control fluidity against other market leaders.
- **Why it helps your AgTech app:** It discusses the optimization of ergonomics and pacing—critical arguments you can use to explain how your app helps farmers make multi-acre property decisions in a matter of seconds rather than minutes. [[1](https://www.gamerefinery.com/league-of-legends-wild-rift-soft-launch-deconstruction-competitor-analysis/)]

Would you like assistance in formatting your case study's **Control Mapping section**, or should we look at how to structure a **User Persona comparison** between a professional gamer and an enterprise farmer?