import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testStats() {
  try {
    const totalCourses = await prisma.course.count();
    const totalUsers = await prisma.user.count();
    const pendingEnrollments = await prisma.enrollment.count({
      where: { status: "PENDING" }
    });
    
    const approvedEnrollments = await prisma.enrollment.findMany({
      where: { status: "APPROVED" },
      include: { course: true }
    });
    
    const totalRevenue = approvedEnrollments.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);

    console.log({
      totalCourses,
      totalUsers,
      pendingEnrollments,
      totalRevenue
    });
  } catch (error) {
    console.error("Stats Test Failed:", error);
  } finally {
    await prisma.$disconnect()
  }
}

testStats()
