CityShob full-stack developer Interview, Step 3
Homework Task

Real-Time Data Synchronization in a To-Do App

Objective:
To evaluate your approach to designing and implementing a real-time web application using modern technologies and best practices. This task will assess your ability to:
1.	Solve the challenge of real-time data updates across multiple clients (e.g., browsers or PCs).
2.	Demonstrate proper design and implementation at all levels of the project (frontend, backend, and database).
3.	Apply relevant design patterns effectively.
Task Description:
Develop a simple To-Do List application that supports real-time updates. When one client makes changes to the data (e.g., adds, edits, or deletes a task), all other connected clients should instantly reflect those changes without needing a page refresh.
Requirements:
1.	Frontend (UI):
•	Implement the UI using Angular.
•	Create a basic To-Do list interface that includes the following functionality:
o	Add a task.
o	Edit a task.
o	Delete a task.
o	Mark a task as completed or incomplete.
•	Use Angular Material (or another UI library) for a clean and professional design.
2.	Backend:
•	Use Node.js with Express.js for the backend.
•	Implement a RESTful API for CRUD operations (Create, Read, Update, Delete) on tasks.
•	Use MongoDB as the database to store tasks.
3.	Real-Time Functionality:

•	Ensure that when a task is updated (e.g., added, edited, or deleted) in one client, all connected clients receive the update in real time.
•	Each task can be edit by one client – if client in edit mode, no one else can edit or delete it


4.	Design Patterns:
•	Use appropriate design patterns throughout the project. Examples include:
o	Frontend: Service pattern for data management, Reactive programming using RxJS.
o	Backend: Repository pattern for database interactions, Factory or Singleton patterns where applicable.
5.	Code Quality:
•	Follow clean code principles.
•	Ensure proper separation of concerns at all levels (frontend, backend, and database).
•	Add comments and documentation where necessary.
6.	Bonus Points:
•	Add authentication to the app (e.g., user login) using JWT or another secure method.
•	Implement additional features like task prioritization or due dates.
Deliverables:
Code Repository:
o	A GitHub or GitLab repository containing the project source code.
o	Provide a README file with:
	Instructions to set up and run the application locally.
	A short explanation of the design decisions and patterns used.
Evaluation Criteria:
The candidates will be evaluated in the following:
1.	Real-Time Updates:
o	How well the real-time functionality is implemented and integrated into the app.
2.	Design & Architecture:
o	The quality of the overall application design, including code structure, separation of concerns, and use of design patterns.
3.	Technical Implementation:
o	Effective use of Angular, Node.js, and MongoDB.
4.	Code Quality:
o	Cleanliness, readability, and maintainability of the code.
5.	Extra Features (if implemented):
o	Any additional functionality that goes beyond the basic requirements.
Submission Timeline:
•	The task is expected to be completed within 5 days.
•	If more time is needed, please communicate in advance.
Support:
If you have any questions or need clarifications, feel free to reach out. Good luck, and we look forward to reviewing your work!
