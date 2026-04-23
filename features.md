# CHECKPOINT


# Tech Stack:

- Go
- React JS
- Which DB needs to be decided(RDBMS v/s NON-RDBMS) -> Simple MongoDB should serve the purpose as primarily storing markdown files in DB is the purpose, but maybe storing the blogs markdown data in an S3 bucket is better, and storing the reference of this data in RDBMS tables. But then RDBMS tables dont really serve the purpose here as I dont have strict relationships defined yet in this website. Probably will depend on further development of features. 

# Features:

## Navigation:
- Terminal/ Menu
- Shortcuts

## Theme:
- Monkey type inspired colorscheme(black, grey with gold-yellow to highlight special things)
- 8 bit game theme

## Pages:
- Admin stats
- About the website 
- About the author/portfolio
- Welcome Page
- Login/Register Modal
- My Blogs/Article Page shown to users
- My blogs/articles which still haven't been exposed to public
- Documentation page organized by project, then date and then time(date and time uses a tree layout display) to users
- Documentation page organized by project, then date and then time(date and time uses a tree layout display) to me only
- Cool Articles, Videos display(need to figure out how to display it)
- Create a new field of an article, video record etc.
- Game
- Navbar rendered everywhere

## Features:
- Embedded Markdown editor for writing documentation
- Render markdown files
- Store markdown files in a day wise organization, and show time wise additions(in a tree manner?)
- JWT Authentication
- Button to render daily docuentation public
- Butons on each blog to toggle public/private
- Admin stats like number of user visits, Number of blogs, how many times documented today, a blog viewed how many times only by users```not admin```(what more cna be added?)
- Checkpoint graphic popup
- CI/CD pipeline using github actions(will be implemented at a later point of time, but how to enable a github action pipeline for each microservice if applicable?)
- UX needs to be smooth, smooth transitions etc. 
- Offline mode detection, and storing blogs locally, once network access is achieved, we send local updates to server to sync changes.
- Article feature where articles are written and stored as markdown files as well?

### (SHOULD BE ADDED?)
- A little game to play if bored?(tic tac toe using minimax)
- A little game to play that takes you through the user's profile?
- Enable authorizing users who register to view blogs?
- Add role based access? 
- Allow for incremental changes, like new small projects/intersting stuff to be integrated as something that can be checked in the website only?
