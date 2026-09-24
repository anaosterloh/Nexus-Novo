import fetch from 'node-fetch';

async function test() {
  try {
    console.log("=== GET /api/entities ===");
    const res1 = await fetch('http://localhost:3000/api/entities?companyId=comp_1');
    console.log(await res1.json());

    console.log("=== GET /api/entities?role=customer ===");
    const res2 = await fetch('http://localhost:3000/api/entities?companyId=comp_1&role=customer');
    console.log(await res2.json());

    console.log("=== GET /api/entities/suggestions ===");
    const res3 = await fetch('http://localhost:3000/api/entities/suggestions?companyId=comp_1&q=Joao');
    console.log(await res3.json());

    console.log("=== GET /api/sales/customers ===");
    const res4 = await fetch('http://localhost:3000/api/sales/customers?companyId=comp_1');
    console.log(await res4.json());

  } catch(e) {
    console.error(e);
  }
}

test();
