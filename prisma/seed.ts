import { prisma } from '../src/lib/prisma'

async function main() {
  const environments = [
    {
      name: 'Test',
      baseUrl: 'https://test-maintenance.bipocloud.com',
    },
    {
      name: 'UAT',
      baseUrl: 'https://uat-maintenance.butterglobe.com',
    },
    {
      name: 'EU',
      baseUrl: 'https://maintenance.butterglobe.com',
    },
    {
      name: 'CN',
      baseUrl: 'https://maintenance.butterglobe.cn',
    },
    {
      name: 'Wise',
      baseUrl: 'http://wise-maintenance.bipocloud.com',
    },
  ]

  for (const env of environments) {
    // 1. Check by Base URL
    const existingUrl = await prisma.releaseEnvironment.findFirst({
      where: { baseUrl: env.baseUrl },
    })

    if (existingUrl) {
       // Update name if needed
       if (existingUrl.name !== env.name) {
           await prisma.releaseEnvironment.update({
               where: { id: existingUrl.id },
               data: { name: env.name }
           })
           console.log(`Updated environment name for ${env.baseUrl}: ${existingUrl.name} -> ${env.name}`)
       } else {
           console.log(`Environment already exists: ${env.name} (${env.baseUrl})`)
       }
    } else {
       // 2. Check by Name (if URL didn't match, maybe URL changed)
       const existingName = await prisma.releaseEnvironment.findFirst({
            where: { name: env.name }
       })
       
       if (existingName) {
           await prisma.releaseEnvironment.update({
               where: { id: existingName.id },
               data: { baseUrl: env.baseUrl }
           })
           console.log(`Updated environment URL for ${env.name}: ${existingName.baseUrl} -> ${env.baseUrl}`)
       } else {
           // 3. Create new
           await prisma.releaseEnvironment.create({
               data: env,
           })
           console.log(`Created environment: ${env.name} (${env.baseUrl})`)
       }
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
