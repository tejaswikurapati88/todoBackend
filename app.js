const express = require('express')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server is running at http://localhost:3000'),
    )
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const checkValidInput = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryPresent = categoryArray.includes(category)
    if (isCategoryPresent === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const ispriorityPresent = priorityArray.includes(priority)
    if (ispriorityPresent === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isstatusPresent = statusArray.includes(status)
    if (isstatusPresent === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')

      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q

  next()
}

const checkrequestBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryPresent = categoryArray.includes(category)
    if (isCategoryPresent === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const ispriorityPresent = priorityArray.includes(priority)
    if (ispriorityPresent === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isstatusPresent = statusArray.includes(status)
    if (isstatusPresent === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)

      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')

      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.todo = todo
  request.id = id

  next()
}

//API GET 1
app.get('/todos/', checkValidInput, async (request, response) => {
  const {search_q = '', status = '', priority = '', category = ''} = request
  console.log(search_q, status, priority, category)
  const getArrayQuery = `
  SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date as dueDate 
  FROM todo 
  WHERE todo LIKE "%${search_q}%" AND
        status LIKE "%${status}%" AND
        priority LIKE "%${priority}%" AND
        category LIKE "%${category}%";`

  const resp = await db.all(getArrayQuery)
  response.send(resp)
})

//API 2 get
app.get('/todos/:todoId/', checkValidInput, async (request, response) => {
  const {todoId} = request.params
  const getArrayQuery = `
  SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date as dueDate 
  FROM todo 
  WHERE id = ${todoId}`
  const resp = await db.get(getArrayQuery)
  response.send(resp)
})

app.get('/agenda/', checkValidInput, async (request, response) => {
  const {date} = request
  console.log(date, 'a')
  const queryArray = `
  SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date as dueDate 
  FROM todo 
  WHERE due_date = "${date}"; `
  const respo = await db.all(queryArray)

  if (respo === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(respo)
  }
})

app.post('/todos/', checkrequestBody, async (request, response) => {
  const {id, todo, status, priority, category, dueDate} = request.body
  const postQuery = `
  INSERT INTO todo (id, todo, status, priority, category, due_date) 
  VALUES 
  (${id}, "${todo}", "${status}", "${priority}", "${category}", "${dueDate}");`
  const createUser = await db.run(postQuery)
  console.log(createUser)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkrequestBody, async (request, response) => {
  const {status, todo, priority, category, dueDate} = request.body
  let updatetodoQuery = null
  const {todoId} = request.params

  switch (true) {
    case status !== undefined:
      updatetodoQuery = `
        UPDATE todo 
        SET status = "${status}" 
        WHERE id = ${todoId};`
      await db.run(updatetodoQuery)
      response.send('Status Updated')

      break

    case priority !== undefined:
      updatetodoQuery = `
      UPDATE todo
      SET priority = "${priority}"
      WHERE id = ${todoId};`
      await db.run(updatetodoQuery)
      response.send('Priority Updated')

      break

    case category !== undefined:
      updatetodoQuery = `
      UPDATE todo
      SET category = "${category}"
      WHERE id = ${todoId};`
      await db.run(updatetodoQuery)
      response.send('Category Updated')

      break

    case todo !== undefined:
      updatetodoQuery = `
      UPDATE todo
      SET todo = "${todo}"
      WHERE id = ${todoId};`
      await db.run(updatetodoQuery)
      response.send('Todo Updated')

      break

    case dueDate !== undefined:
      updatetodoQuery = `
      UPDATE todo
      SET due_date = "${dueDate}"
      where id = ${todoId};`
      await db.run(updatetodoQuery)
      response.send('Due Date Updated')

      break

    default:
      break
  }
})

app.delete('/todos/:todoId/', checkValidInput, async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  DELETE FROM todo WHERE id = ${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
