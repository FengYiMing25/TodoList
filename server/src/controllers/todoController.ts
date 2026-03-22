import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import db from "../database";
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoQueryParams,
  Category,
  Tag,
  Attachment,
} from "@shared/types";

interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  category_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_color?: string;
}

interface TagRow {
  id: string;
  name: string;
  color: string;
}

interface AttachmentRow {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  todo_id: string;
  created_at: string;
}

const formatTodo = (
  todo: TodoRow,
  tags: Tag[] = [],
  attachments: Attachment[] = []
): Todo => ({
  id: todo.id,
  title: todo.title,
  description: todo.description || undefined,
  status: todo.status as Todo["status"],
  priority: todo.priority as Todo["priority"],
  dueDate: todo.due_date || undefined,
  categoryId: todo.category_id || undefined,
  category: todo.category_id
    ? {
        id: todo.category_id,
        name: todo.category_name!,
        color: todo.category_color!,
      }
    : undefined,
  tags,
  attachments,
  userId: todo.user_id,
  createdAt: todo.created_at,
  updatedAt: todo.updated_at,
});

export const getTodos = async (
  request: FastifyRequest<{ Querystring: TodoQueryParams }>,
  reply: FastifyReply
) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    categoryId,
    keyword,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = request.query;

  const sortByMap: Record<string, string> = {
    createdAt: "created_at",
    updatedAt: "updated_at",
    dueDate: "due_date",
    title: "title",
    priority: "priority",
    status: "status",
  };
  const dbSortBy = sortByMap[sortBy] || "created_at";

  let sql = `SELECT t.*, c.id as category_id, c.name as category_name, c.color as category_color FROM todos t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = ?`;
  const params: unknown[] = [request.userId];

  if (status) {
    sql += " AND t.status = ?";
    params.push(status);
  }
  if (priority) {
    sql += " AND t.priority = ?";
    params.push(priority);
  }
  if (categoryId) {
    sql += " AND t.category_id = ?";
    params.push(categoryId);
  }
  if (keyword) {
    sql += " AND (t.title LIKE ? OR t.description LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countSql = sql.replace(
    "SELECT t.*, c.id as category_id, c.name as category_name, c.color as category_color",
    "SELECT COUNT(*) as total"
  );
  const countResult = db.get<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  sql += ` ORDER BY t.${dbSortBy} ${sortOrder === "asc" ? "ASC" : "DESC"} LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const todos = db.all<TodoRow>(sql, params);

  const todosWithDetails = todos.map((todo) => {
    const tags = db.all<Tag>(
      `SELECT t.id, t.name, t.color FROM tags t INNER JOIN todo_tags tt ON t.id = tt.tag_id WHERE tt.todo_id = ?`,
      [todo.id]
    );
    const attachments = db.all<AttachmentRow>(
      `SELECT id, filename, original_name, mime_type, size, url, todo_id, created_at FROM attachments WHERE todo_id = ?`,
      [todo.id]
    );
    return formatTodo(
      todo,
      tags,
      attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        originalName: a.original_name,
        mimeType: a.mime_type,
        size: a.size,
        url: a.url,
        todoId: a.todo_id,
        createdAt: a.created_at,
      }))
    );
  });

  return reply.send({
    success: true,
    data: {
      items: todosWithDetails,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getTodoById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const todo = db.get<TodoRow>(
    `SELECT t.*, c.id as category_id, c.name as category_name, c.color as category_color FROM todos t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ? AND t.user_id = ?`,
    [id, request.userId]
  );

  if (!todo) {
    return reply.code(404).send({ success: false, message: "待办事项不存在" });
  }

  const tags = db.all<Tag>(
    `SELECT t.id, t.name, t.color FROM tags t INNER JOIN todo_tags tt ON t.id = tt.tag_id WHERE tt.todo_id = ?`,
    [todo.id]
  );
  const attachments = db.all<AttachmentRow>(
    `SELECT id, filename, original_name, mime_type, size, url, todo_id, created_at FROM attachments WHERE todo_id = ?`,
    [todo.id]
  );

  return reply.send({
    success: true,
    data: formatTodo(
      todo,
      tags,
      attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        originalName: a.original_name,
        mimeType: a.mime_type,
        size: a.size,
        url: a.url,
        todoId: a.todo_id,
        createdAt: a.created_at,
      }))
    ),
  });
};

export const createTodo = async (
  request: FastifyRequest<{ Body: CreateTodoRequest }>,
  reply: FastifyReply
) => {
  const { title, description, priority = "medium", dueDate, categoryId, tagIds = [] } = request.body;

  if (!title) {
    return reply.code(400).send({ success: false, message: "标题不能为空" });
  }

  const todoId = uuidv4();

  db.run(
    `INSERT INTO todos (id, title, description, priority, due_date, category_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [todoId, title, description, priority, dueDate, categoryId, request.userId]
  );

  if (tagIds.length > 0) {
    for (const tagId of tagIds) {
      db.run("INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)", [todoId, tagId]);
    }
  }

  const todo = db.get<TodoRow>("SELECT * FROM todos WHERE id = ?", [todoId]);

  return reply.code(201).send({
    success: true,
    data: formatTodo(todo!),
  });
};

export const updateTodo = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateTodoRequest }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { title, description, status, priority, dueDate, categoryId, tagIds } = request.body;

  const existingTodo = db.get<TodoRow>(
    "SELECT * FROM todos WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!existingTodo) {
    return reply.code(404).send({ success: false, message: "待办事项不存在" });
  }

  db.run(
    `UPDATE todos SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), priority = COALESCE(?, priority), due_date = COALESCE(?, due_date), category_id = COALESCE(?, category_id), updated_at = datetime('now') WHERE id = ?`,
    [title, description, status, priority, dueDate, categoryId, id]
  );

  if (tagIds !== undefined) {
    db.run("DELETE FROM todo_tags WHERE todo_id = ?", [id]);
    for (const tagId of tagIds) {
      db.run("INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)", [id, tagId]);
    }
  }

  const todo = db.get<TodoRow>("SELECT * FROM todos WHERE id = ?", [id]);
  const tags = db.all<Tag>(
    `SELECT t.id, t.name, t.color FROM tags t INNER JOIN todo_tags tt ON t.id = tt.tag_id WHERE tt.todo_id = ?`,
    [id]
  );
  const attachments = db.all<AttachmentRow>(
    `SELECT id, filename, original_name, mime_type, size, url, todo_id, created_at FROM attachments WHERE todo_id = ?`,
    [id]
  );

  return reply.send({
    success: true,
    data: formatTodo(
      todo!,
      tags,
      attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        originalName: a.original_name,
        mimeType: a.mime_type,
        size: a.size,
        url: a.url,
        todoId: a.todo_id,
        createdAt: a.created_at,
      }))
    ),
  });
};

export const deleteTodo = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const todo = db.get<TodoRow>(
    "SELECT * FROM todos WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!todo) {
    return reply.code(404).send({ success: false, message: "待办事项不存在" });
  }

  db.run("DELETE FROM todos WHERE id = ?", [id]);

  return reply.send({ success: true, message: "删除成功" });
};

export const toggleTodoStatus = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  const todo = db.get<TodoRow>(
    "SELECT * FROM todos WHERE id = ? AND user_id = ?",
    [id, request.userId]
  );

  if (!todo) {
    return reply.code(404).send({ success: false, message: "待办事项不存在" });
  }

  const newStatus = todo.status === "completed" ? "pending" : "completed";

  db.run(`UPDATE todos SET status = ?, updated_at = datetime('now') WHERE id = ?`, [
    newStatus,
    id,
  ]);

  const updatedTodo = db.get<TodoRow>("SELECT * FROM todos WHERE id = ?", [id]);
  const tags = db.all<Tag>(
    `SELECT t.id, t.name, t.color FROM tags t INNER JOIN todo_tags tt ON t.id = tt.tag_id WHERE tt.todo_id = ?`,
    [id]
  );
  const attachments = db.all<AttachmentRow>(
    `SELECT id, filename, original_name, mime_type, size, url, todo_id, created_at FROM attachments WHERE todo_id = ?`,
    [id]
  );

  return reply.send({
    success: true,
    data: formatTodo(
      updatedTodo!,
      tags,
      attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        originalName: a.original_name,
        mimeType: a.mime_type,
        size: a.size,
        url: a.url,
        todoId: a.todo_id,
        createdAt: a.created_at,
      }))
    ),
  });
};
