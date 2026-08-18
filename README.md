# Fathom Learning

Build "Fathom" — An Adaptive Learning Intelligence Platform

Build a production-quality web application called Learn Anything.

The core idea:

A user tells us what they want to become capable of doing, how much time they have per day, their current level, budget, and target deadline. The platform researches relevant learning resources from across the web, builds the minimum effective personalized learning path, tracks actual mastery, creates organized notes, gives feedback, generates practice, and continuously adapts the roadmap.

This is not a course marketplace and not a generic AI chatbot.

The product should feel like a combination of:

a personal learning strategist

an intelligent curriculum designer

a research engine

an AI tutor

a progress tracker

a personal knowledge base

The design should feel like a polished modern startup product, not an educational LMS.

1. TECH STACK

Use:

Next.js / React

TypeScript

Tailwind CSS

shadcn/ui

Supabase for:

PostgreSQL database

authentication

Google OAuth

user data

storage where required

Responsive desktop-first UI with excellent mobile responsiveness

Server-side API routes / server actions where appropriate

Secure environment variable handling

Set up Google Sign-In through Supabase Auth.

Users must be able to:

sign in with Google

sign out

remain authenticated between sessions

have private user-specific data

create multiple learning goals

delete/export their data

Do not use fake authentication or mock users.

2. CORE PRODUCT FLOW

The product flow should be:

Landing page
→ Google Sign In
→ onboarding
→ create learning goal
→ AI analyzes goal
→ skill decomposition
→ resource discovery
→ resource ranking
→ personalized roadmap
→ daily learning sessions
→ practice / assessment
→ mastery tracking
→ notes / knowledge base
→ adaptive roadmap

The system must persist everything in Supabase.

3. LANDING PAGE

Create a premium landing page.

Hero:

Learn anything. Properly.

Subheading:

Tell us what you want to learn, how much time you have, and where you want to get. We build the path, find the right resources, and adapt it as you learn.

Primary CTA:

Start learning

Secondary CTA:

See how it works

Show a visual preview of the product rather than generic stock imagery.

Sections:

How it works

Tell us what you want to learn

We map the skills you need

We find and rank the best resources

We build your personal roadmap

Learn, practice and get feedback

Your path adapts as you improve

Example goals

Learn app development

Learn video editing

Learn guitar

Learn Python

Learn photography

Learn machine learning

Learn public speaking

Learn digital marketing

Key value proposition

Emphasize:

Don't search. Don't guess. Just learn.

4. AUTHENTICATION

Use Supabase Auth with Google OAuth.

Create:

/login

Clean authentication screen with:

Continue with Google

After successful authentication:

create the user profile if it does not exist

send first-time users to onboarding

return existing users to dashboard

Create an appropriate profiles table.

5. ONBOARDING

After first login, show an intelligent onboarding flow.

Do not make everything one giant form.

Use a multi-step wizard with progress indicator.

Step 1 — What do you want to learn?

Large input:

What do you want to learn?

Examples:

app development

film editing

music production

machine learning

Allow natural language.

Example:

I want to learn app development so I can build and publish my own mobile apps.

Step 2 — Desired outcome

Ask:

What do you want to be able to do?

Options:

understand the subject

become job-ready

build projects

pass an exam

become professional

hobby

other

Allow custom answer.

Step 3 — Current level

Options:

Complete beginner

Beginner

Intermediate

Advanced

Not sure

Also provide:

Take a quick diagnostic

This can generate a small adaptive assessment before finalizing the roadmap.

Step 4 — Time

Ask:

How much time can you realistically spend?

Allow:

minutes per day

days per week

Examples:

45 minutes/day

1 hour/day

2 hours/day

Also ask if the available time varies by day.

Step 5 — Deadline

Optional:

Do you have a target date?

Allow:

no deadline

date picker

Step 6 — Budget

Options:

Free only

Mostly free

Will pay for valuable resources

No limit

Step 7 — Learning preferences

Ask:

What works best for you?

Video

Reading

Projects

Exercises

Interactive practice

Mixed

Allow multiple selections.

Step 8 — Generate plan

Show a beautiful generation state.

Do not fake progress.

Show meaningful stages such as:

Understanding your goal

Mapping required skills

Finding prerequisite concepts

Searching learning resources

Comparing resources

Building your path

Estimating workload

Creating your first week

Then produce the roadmap.

6. LEARNING GOAL MODEL

Every learning goal needs:

title

description

desired outcome

current level

time per day

days per week

deadline

budget

preferred formats

status

estimated total hours

estimated completion date

mastery score

created_at

updated_at

Users can have multiple goals.

Example:

Learn Flutter
Learn Video Editing
Learn Music Production


7. AI LEARNING BLUEPRINT

This is the most important backend capability.

For any user goal, the AI should transform the goal into:

Goal

→ skills
→ subskills
→ prerequisites
→ projects
→ assessments

Example:

APP DEVELOPMENT

Programming foundations
│
├── variables
├── functions
├── data structures
└── async programming

UI
│
├── layout
├── navigation
└── state

Backend
│
├── APIs
├── databases
└── authentication

Deployment
│
├── Android
└── iOS


Do not blindly generate enormous curricula.

The AI should determine:

What is actually necessary to reach the user's stated outcome?

8. MINIMUM EFFECTIVE LEARNING PATH

This is a core differentiator.

The system should explicitly minimize unnecessary learning.

For every concept, classify:

Essential

Recommended

Optional

Advanced

The default roadmap should contain the minimum effective path.

The user should be able to expand optional material later.

Do not force users to consume 10 resources that teach the same concept.

9. RESOURCE DISCOVERY ENGINE

Create an architecture for discovering resources from:

YouTube

official documentation

free courses

paid courses

articles

books

tutorials

GitHub repositories

interactive resources

practice platforms

podcasts / audio where appropriate

other publicly searchable educational resources

Important:

Do not scrape or reproduce copyrighted course material.

Store metadata and links where appropriate.

Use official APIs where available.

Design the resource layer so additional providers can be plugged in later.

Create a resources table.

Each resource should support:

title

URL

provider

resource type

author/instructor

duration

price

difficulty

topics

description

quality score

relevance score

recency score

hands-on score

beginner friendliness

discovered_at

source metadata

10. RESOURCE RANKING

The AI should score resources based on:

relevance to the skill

authority / quality

clarity

difficulty fit

time efficiency

practical value

freshness

user learning preference

cost

redundancy

Do NOT simply rank by popularity.

For each skill, choose the best resource or smallest resource set that adequately covers it.

Example:

STATE MANAGEMENT

Recommended:
Flutter official documentation — 22 min
YouTube practical tutorial — 41 min
Hands-on exercise — 20 min

Total: 1h 23m

Why:
The documentation gives the conceptual foundation,
the video provides practical implementation,
and the exercise verifies understanding.


11. RESOURCE SEARCH EXPERIENCE

Create a page where users can inspect the resources found for their roadmap.

Filters:

Free

Paid

Video

Reading

Course

Project

Beginner

Advanced

Shortest

Highest rated

Recommended

Show:

Why this resource was selected

rather than just the resource title.

Example:

Recommended because it covers 82% of the required concept and is significantly shorter than the alternatives.

12. ROADMAP

Create a beautiful roadmap UI.

Example:

YOUR LEARNING PATH

Estimated total: 47 hours
At your pace: 39 days
Current mastery: 24%

WEEK 1
Programming foundations
████████░░ 80%

WEEK 2
Flutter fundamentals
████░░░░░░ 40%

WEEK 3
UI + navigation
░░░░░░░░░░ 0%

WEEK 4
State management
░░░░░░░░░░ 0%


Each module should show:

estimated time

concepts

resources

exercises

project

assessment

mastery

status

Allow users to open any module.

13. DAILY LEARNING PLAN

Generate an adaptive daily plan based on:

available time

current progress

mastery

upcoming deadline

unfinished work

difficulty

spaced review requirements

Example:

TODAY

45 MINUTES

15 min
Review JavaScript async concepts

15 min
Watch selected lesson

10 min
Complete practice

5 min
Explain the concept in your own words


Never exceed the user's available time unless they explicitly choose to.

14. LEARNING SESSION

Create a dedicated distraction-free learning mode.

At the top:

45 MIN LEARNING SESSION

Show the current objective.

The user can:

open the resource

take notes

highlight important ideas

mark sections complete

ask AI questions

save concepts

start practice

finish session

At the end:

Ask:

How confident are you?

But do not rely only on self-reported confidence.

Generate a short assessment.

15. ACTIVE LEARNING

After learning something, the platform should verify understanding.

Generate:

multiple choice

short answer

explain-in-your-own-words

practical tasks

coding exercises where appropriate

scenario-based questions

debugging tasks

mini projects

The assessment type should match the subject.

For example:

Programming:
→ code task

Photography:
→ analyze example image

Marketing:
→ create campaign

Video editing:
→ make edit decision

Mathematics:
→ solve problem

Music:
→ identify / perform / compose where possible

Do not make every subject into multiple-choice quizzes.

16. MASTERY ENGINE

Track mastery at the concept level, not merely module completion.

For each skill store:

exposure

practice

assessment score

recall

application

confidence

last reviewed

mastery estimate

Example:

ASYNC PROGRAMMING

Understanding    82%
Recall           68%
Application      54%
Overall mastery  67%


Use this to decide what the learner sees next.

17. ADAPTIVE ROADMAP

The roadmap must change based on performance.

Example:

If user masters a concept quickly:

Skip beginner reinforcement.

If user repeatedly fails a concept:

Add prerequisite explanation + alternative resource + extra practice.

If user misses several days:

Recalculate the schedule.

If the deadline moves:

Recalculate workload.

If the user says:

“I already know this.”

allow them to test out of the section.

18. AI FEEDBACK

After practice, give specific feedback.

Bad:

Great job! Keep practicing.

Good:

Your solution works, but you are repeatedly duplicating state across components. Review state ownership before continuing.

Feedback should be:

specific

actionable

concise

related to the actual mistake

19. PERSONAL KNOWLEDGE BASE

Every user gets a personal knowledge base.

Create organized notes automatically.

Structure:

APP DEVELOPMENT

Flutter
  UI
  State
  Navigation
  Networking

Dart
  Variables
  Functions
  Async

Backend
  APIs
  Databases


Each concept can contain:

concise explanation

important points

examples

user notes

common mistakes

related concepts

source links

personal confidence

mastery

revision history

Do not create duplicate notes every time the user encounters the same concept.

The system should update the existing concept.

20. AI NOTE TAKING

Allow users to:

paste notes

upload notes

paste transcripts

import text

save highlights

AI should convert messy information into structured knowledge.

Buttons:

Summarize

Extract key concepts

Turn into notes

Create flashcards

Generate questions

Connect to existing knowledge

21. PERSONAL AI TUTOR

Every learning goal should have an AI tutor.

Users can ask:

Explain this more simply.

Give me another example.

Test me.

Why is my answer wrong?

Connect this to something I've already learned.

Give me a harder problem.

I don't understand step 3.

The tutor should use the user's roadmap, progress, notes, and previous mistakes as context.

It should not behave like a generic ChatGPT window.

22. PROJECT-BASED LEARNING

For skills where projects make sense, generate projects.

Example:

PROJECT

Build a habit tracker

Skills practiced:
✓ UI
✓ state
✓ navigation
✓ local storage

Estimated time:
4h 30m

Difficulty:
Beginner+

Requirements:
...


Projects should feed back into mastery.

Completing a project should increase application mastery more than merely watching a resource.

23. DASHBOARD

Create a premium main dashboard.

Show:

Current goal

Learn App Development

Today's learning

42 / 60 minutes

Overall mastery

64%

Current streak

8 days

Estimated completion

October 12

Today's plan

Clearly displayed.

Continue learning

Large primary button.

Weakest concepts

Show the 3 concepts needing the most attention.

Recent notes

Upcoming milestones

Active projects

The dashboard should prioritize what to do next, not data overload.

24. PROGRESS PAGE

Show:

overall mastery

skill breakdown

time spent

consistency

assessments

projects

concepts mastered

weak areas

learning velocity

Use elegant visualizations.

Avoid meaningless gamification.

25. GOAL MANAGEMENT

Users can:

create goal

pause goal

resume goal

edit time availability

change deadline

change outcome

archive goal

Whenever constraints change, regenerate the roadmap.

26. SEARCH / EXPLORE

Create an Explore page where users can search:

video editing

Python

guitar

financial literacy

Blender

physics

Show popular learning goals and curated paths.

But personalized learning remains the main experience.

27. DATABASE SCHEMA

Create proper Supabase tables with relationships.

At minimum:

profiles

learning_goals

skills

skill_dependencies

learning_paths

modules

resources

module_resources

learning_sessions

user_progress

concept_mastery

assessments

questions

answers

notes

knowledge_nodes

projects

user_projects

bookmarks

user_preferences

activity_log

Use UUID primary keys.

Add appropriate indexes.

Add timestamps.

28. SECURITY

Implement Supabase Row Level Security.

Users must only access their own:

goals

progress

notes

sessions

assessments

projects

personal data

Public resource metadata can remain public where appropriate.

Never expose service-role credentials to the client.

Never hardcode API keys.

29. AI ARCHITECTURE

Do not hardcode one giant prompt into the frontend.

Create a structured AI service layer.

Separate functions for:

generateLearningBlueprint()

searchResources()

rankResources()

generateRoadmap()

generateDailyPlan()

generateAssessment()

evaluateAnswer()

generateNotes()

updateMastery()

adaptRoadmap()

generateProject()

generateTutorResponse()

Make these replaceable so models/providers can change later.

30. RESOURCE INGESTION ARCHITECTURE

Build the app so resource providers are modular.

Example:

ResourceProvider
 ├── YouTubeProvider
 ├── WebSearchProvider
 ├── DocumentationProvider
 ├── CourseProvider
 └── GithubProvider


Do not pretend every provider has the same API.

Store normalized metadata in the database.

Avoid scraping content where the platform prohibits it.

The application should primarily use publicly available metadata, official APIs, links, and permitted content.

31. AI GENERATION UX

Whenever the system is doing expensive work, show clear stages.

Example:

Building your learning path

✓ Understanding goal
✓ Identifying prerequisites
✓ Mapping skills
✓ Finding resources
✓ Comparing 127 resources
✓ Removing redundant material
✓ Building schedule

Your path is ready.


Do not use fake percentages.

32. DESIGN DIRECTION

The app should feel premium.

Visual direction:

minimal

sophisticated

modern

excellent typography

generous spacing

subtle motion

dark/light mode

polished cards

clean data visualization

smooth transitions

excellent empty states

Avoid:

childish educational design

excessive gradients

excessive rounded cards

gamified cartoon UI

generic AI purple aesthetics

Think:

Linear + Notion + modern developer tooling + premium education platform.

33. IMPORTANT PRODUCT PRINCIPLES

The app must follow these principles:

1. Outcome over content

The user cares about what they can do, not how many videos they watched.

2. Minimum effective learning

Don't overwhelm people with resources.

3. Active learning over passive consumption

Practice and application matter.

4. Personalized paths

Two learners with the same goal can have different paths.

5. Adaptive progression

The roadmap should evolve based on actual performance.

6. One source of truth

The user's notes, progress, mastery, resources and projects should all connect.

7. No fake AI

Do not fabricate resources, reviews, completion, or learning outcomes.

8. Real usefulness over gamification

Streaks and badges are secondary.

34. MVP PRIORITY

Do NOT attempt every feature before making the product usable.

Build in this order:

Phase 1

Authentication

Supabase database

Onboarding

Learning goal creation

AI skill decomposition

Basic resource discovery

Roadmap generation

Dashboard

Daily plan

Progress tracking

Phase 2

Assessments

Mastery engine

Adaptive roadmap

AI notes

Knowledge base

AI tutor

Phase 3

Projects

Advanced resource providers

Calendar

Browser extension

Importing notes/content

Community learning paths

Advanced analytics

35. CRITICAL REQUIREMENT

The first successful user experience should be:

User signs in with Google.

Enters something they want to learn.

Says how much time they have.

Answers a few onboarding questions.

Clicks Build My Path.

The AI researches and structures the topic.

The user receives a personalized roadmap.

The roadmap contains actual useful external resources.

The user can immediately begin their first learning session.

Progress and knowledge persist in the database.

There must be no fake placeholder experience pretending resources were searched.

36. START WITH A REAL END-TO-END PIPELINE

Before building secondary features, make this complete flow work:

Google login
→ goal
→ onboarding
→ AI skill tree
→ resource discovery
→ resource ranking
→ roadmap
→ daily plan
→ learning session
→ assessment
→ mastery update
→ database persistence
→ adaptive next step

Every stage should use real data and be connected.

Do not build isolated mock screens.

37. FINAL PRODUCT FEEL

When a new user finishes onboarding, they should feel:

“I told this thing what I want to learn, and it figured out the entire journey for me.”

When they return tomorrow:

“It already knows exactly what I should do next.”

After a month:

“It knows what I understand, what I'm weak at, what I've learned, and what I need to do next.”

That is the product.

Build the foundation cleanly so this can eventually become a true “Learn Anything” intelligence layer over the world's educational resources, rather than a simple course directory.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fathomai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f4d6b436-95f5-4c56-88a9-2d0c4c699b9b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
