const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server has been started");
    });
  } catch (error) {
    console.log(`Database Error : ${error.message}`);
    process.exit(-1);
  }
};

initializeDBAndServer();

//GET list of all todos whose status is 'TO DO'

app.get("/todos/", async (request, response) => {
  try {
    const { status = "", priority = "", search_q = "" } = request.query;
    console.log(request.query);
    console.log(status, priority);
    const getDataQuery = `select * from todo 
                          where status like '%${status}%' and
                                 priority like '%${priority}%' and
                                 todo like '%${search_q}%';`;

    const todoDetails = await db.all(getDataQuery);

    if (todoDetails === undefined || todoDetails.length === 0) {
      response.status(401);
      response.send("Bad Query Request");
      console.log("Bad Query Request");
    } else {
      console.log(todoDetails);
      response.send(todoDetails);
    }
  } catch (error) {
    console.log(`Database error : ${error.message}`);
    response.status(300);
    response.send("database server error");
  }
});

//GET specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;

    const getIdQuery = `select * from todo where id = '${todoId}';`;
    const todoItem = await db.get(getIdQuery);
    if (todoItem !== undefined) {
      response.send(todoItem);
    } else {
      response.status(401);
      response.send("Bad Request");
    }
  } catch (error) {
    console.log(error.message);
    response.status(300);
    response.send("server side error");
  }
});

//POST Create a todo in the todo table

app.post("/todos/", async (request, response) => {
  try {
    const itemData = request.body;
    const { id, todo, priority, status } = itemData;

    const verifyTodoQuery = `select * from todo where id = '${id}' or todo = '${todo}';`;
    const isTodoItemExists = await db.get(verifyTodoQuery);

    if (isTodoItemExists !== undefined) {
      console.log(isTodoItemExists);
      response.status(400);
      response.send("To do already exits with this id or todo");
    } else {
      const postItemQuery = `insert into todo(id,todo,priority,status)
                              values('${id}','${todo}','${priority}','${status}');`;
      const todoId = await db.run(postItemQuery);
      //   console.log(todoId.lastID);
      response.send("Todo Successfully Added");
    }
  } catch (error) {
    console.log(error.message);
  }
});

//verifying item exit or not

const isTodoItemExists = async (request, response, next) => {
  const { todoId } = request.params;
  const verifyTodo = `select * from todo where id = '${todoId}';`;
  const isTodoExist = await db.get(verifyTodo);

  if (isTodoExist === undefined) {
    response.status(400);
    response.send("Todo Item doesn't exit");
  } else {
    next();
  }
};

//PUT Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", isTodoItemExists, async (request, response) => {
  try {
    const { todoId } = request.params;
    const updateTodoBody = request.body;
    const { todo, priority, status } = updateTodoBody;

    // const verifyTodo = `select * from todo where id = '${todoId}';`;
    // const isTodoExist = await db.get(verifyTodo);

    // if (isTodoExist === undefined) {
    //   response.status(400);
    //   response.send("Todo Item doesn't exit");
    // } else {
    let updateKey, updateValue, responseMsg;

    if (todo !== undefined) {
      updateKey = "todo";
      updatedValue = todo;
      responseMsg = "Todo Updated";
    } else if (priority !== undefined) {
      updateKey = "priority";
      updatedValue = priority;
      responseMsg = "Priority Updated";
    } else if (status !== undefined) {
      updateKey = "status";
      updatedValue = status;
      responseMsg = "Status Updated";
    }

    console.log(updateKey);
    console.log(updatedValue);
    const updateTodoQuery = `update todo set '${updateKey}' = '${updatedValue}' where id = '${todoId}';`;
    await db.run(updateTodoQuery);

    response.send(responseMsg);
    // }
  } catch (error) {
    console.log(error.message);
  }
});

//DELETE Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", isTodoItemExists, async (request, response) => {
  try {
    const { todoId } = request.params;

    const deleteItemQuery = `delete from todo where id = '${todoId}';`;
    await db.run(deleteItemQuery);
    response.send("Todo Deleted");
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = app;
