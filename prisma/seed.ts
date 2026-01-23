import { prisma } from '../src/lib/prisma'

async function main() {
  const environments = [
    {
      name: 'Test Environment',
      baseUrl: 'https://test-maintenance.bipocloud.com',
    },
    {
      name: 'Production Environment',
      baseUrl: 'https://maintenance.bipocloud.com',
    },
  ]

  for (const env of environments) {
    const existing = await prisma.releaseEnvironment.findFirst({
      where: { baseUrl: env.baseUrl },
    })
    if (!existing) {
      await prisma.releaseEnvironment.create({
        data: env,
      })
      console.log(`Created environment: ${env.name}`)
    } else {
      console.log(`Environment already exists: ${env.name}`)
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })