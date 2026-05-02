import prisma from "../src/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "admin@example.com";

  // check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  // hash password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      phone: "252610000000",
      password: hashedPassword,
      role:"ADMIN",
    },
  });

  console.log("Admin created:", admin.email);
  const studentEmail = "student@example.com";
  const studentPassword = await bcrypt.hash("student123", 10);

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: "John Student",
      email: studentEmail,
      phone: "252610000001",
      password: studentPassword,
      role: "USER",
    },
  });

  console.log("Student user ready:", student.email);

  // Sample Courses
  const courses = [
    {
      name: "React Mastery",
      description: "Learn React from scratch to advanced patterns.",
      price: 49.99,
      durationMonths: 3,
      category: "Development",
      userId: admin.id
    },
    {
      name: "Full-Stack Next.js",
      description: "Build modern web apps with Next.js 15 and Prisma.",
      price: 99.99,
      durationMonths: 6,
      category: "Development",
      userId: admin.id
    },
    {
      name: "UI/UX Design Fundamentals",
      description: "Master Figma and design principles.",
      price: 29.99,
      durationMonths: 2,
      category: "Design",
      userId: admin.id
    }
  ];

  for (const c of courses) {
    await prisma.course.upsert({
      where: { id: 0 }, // Not useful for upsert by unique name if not defined, but we'll just create if not exists
      update: {},
      create: c
    });
  }

  console.log("Sample courses created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });