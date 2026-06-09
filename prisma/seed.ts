import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // create users
  const usersData = [
    {
      name: "Jon Doe",
      email: "admin@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "ADMIN",
      emailVerified: true,
    },

    {
      name: "Anna Smith",
      email: "anna.smith@gmail.com",
      password: await bcrypt.hash("password1234", 10),
      role: "MEMBER",
      emailVerified: true,
    },
  ] satisfies Prisma.UserCreateManyInput[];

  await prisma.user.createMany({
    data: usersData,
  });

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: usersData.map((u) => u.email),
      },
    },
    select: { id: true, email: true },
  });

  const usersByEmail = new Map(users.map((u) => [u.email, u.id]));

  // create projects
  const projectsData = [
    {
      title: "TaskFlow Admin Panel",
      description:
        "Backoffice project for admin workspace and user management.",
      ownerId: usersByEmail.get("admin@test.com")!,
    },

    {
      title: "Marketing Sprint Board",
      description:
        "Campaign planning board for landing pages and social media tasks.",
      ownerId: usersByEmail.get("anna.smith@gmail.com")!,
    },
  ] satisfies Prisma.ProjectCreateManyInput[];

  await prisma.project.createMany({
    data: projectsData,
  });

  const projects = await prisma.project.findMany({
    where: {
      ownerId: {
        in: usersData.map((u) => usersByEmail.get(u.email)!),
      },
    },
    select: { id: true, title: true },
  });

  const projectsByTitle = new Map(projects.map((p) => [p.title, p.id]));

  // create tasks

  const tasksData = [
    {
      title: "Design Admin Dashboard",
      description: "Create wireframes and mockups for the admin panel.",
      status: "TODO",
      projectId: projectsByTitle.get("TaskFlow Admin Panel")!,
      priority: "HIGH",
      assigneeId: usersByEmail.get("admin@test.com")!,
    },

    {
      title: "Set Up User Authentication",
      description: "Implement login and registration functionality.",
      status: "IN_PROGRESS",
      projectId: projectsByTitle.get("Marketing Sprint Board")!,
      priority: "LOW",
      assigneeId: usersByEmail.get("anna.smith@gmail.com")!,
    },
  ] satisfies Prisma.TaskCreateManyInput[];

  await prisma.task.createMany({
    data: tasksData,
  });

  const tasks = await prisma.task.findMany({
    where: {
      projectId: {
        in: projectsData.map((p) => projectsByTitle.get(p.title)!),
      },
    },
    select: { id: true, title: true },
  });

  const tasksByTitle = new Map(tasks.map((t) => [t.title, t.id]));

  // create comments
  const commentsData = [
    {
      text: "Initial task creation for admin dashboard design.",
      taskId: tasksByTitle.get("Design Admin Dashboard")!,
      authorId: usersByEmail.get("admin@test.com")!,
    },

    {
      text: "Started working on user authentication setup.",
      taskId: tasksByTitle.get("Set Up User Authentication")!,
      authorId: usersByEmail.get("anna.smith@gmail.com")!,
    },
  ] satisfies Prisma.CommentCreateManyInput[];

  await prisma.comment.createMany({
    data: commentsData,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
