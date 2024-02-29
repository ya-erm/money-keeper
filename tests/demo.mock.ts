export const mockData = `
{
  "categories": [
    {
      "id": "38eaf1fa-f514-4649-b6d1-c83ab9324f24",
      "type": "IN",
      "name": "Work",
      "icon": "mdi:office-building"
    },
    {
      "id": "0a6e4a28-93cf-42a3-be3a-6d6cc9b2da56",
      "type": "OUT",
      "name": "Shop",
      "icon": "mdi:store"
    },
    {
      "id": "67d697eb-bef0-467b-a9e7-18c9c69b2ce9",
      "type": "OUT",
      "name": "Pets",
      "icon": "mdi:cat"
    }
  ],
  "accounts": [
    {
      "id": "f6ddb1f2-d708-4ff4-bc0c-5d7df732aee6",
      "name": "Cahse",
      "icon": null,
      "currency": "TST",
      "order": 1
    },
    {
      "id": "6594012d-eee7-4579-810d-43b0b0bdae14",
      "name": "USD",
      "icon": "mdi:cash",
      "currency": "USD",
      "order": 2
    }
  ],
  "tags": [
    {
      "id": "7c105d05-f428-487e-9d62-0e9ca7702680",
      "name": "Cat"
    }
  ],
  "transactions": [
    {
      "id": "89bca32a-3b19-4e0c-8a3e-569d0f2cc9cd",
      "accountId": "f6ddb1f2-d708-4ff4-bc0c-5d7df732aee6",
      "categoryId": "00000000-0001-0002-8ff6-187bca92f3f9",
      "date": "2023-05-26T18:45:00.000Z",
      "amount": 400,
      "comment": "Transfer",
      "tagIds": [],
      "linkedTransactionId": "cb8ac389-b4cb-4ca4-b8d6-18b7588058fc"
    },
    {
      "id": "cb8ac389-b4cb-4ca4-b8d6-18b7588058fc",
      "accountId": "6594012d-eee7-4579-810d-43b0b0bdae14",
      "categoryId": "00000000-0001-0001-b91e-1a1822f82ab9",
      "date": "2023-05-26T18:45:00.000Z",
      "amount": 100,
      "comment": "Transfer",
      "tagIds": [],
      "linkedTransactionId": "89bca32a-3b19-4e0c-8a3e-569d0f2cc9cd"
    },
    {
      "id": "dcd0572e-dc69-4bea-8373-e2d0b960fef7",
      "accountId": "f6ddb1f2-d708-4ff4-bc0c-5d7df732aee6",
      "categoryId": "67d697eb-bef0-467b-a9e7-18c9c69b2ce9",
      "date": "2023-05-26T18:30:00.000Z",
      "amount": 50.5,
      "comment": "Food for pets",
      "tagIds": ["7c105d05-f428-487e-9d62-0e9ca7702680"]
    },
    {
      "id": "cbe9dc96-e78d-4a15-9ba4-2d283b590c99",
      "accountId": "f6ddb1f2-d708-4ff4-bc0c-5d7df732aee6",
      "categoryId": "38eaf1fa-f514-4649-b6d1-c83ab9324f24",
      "date": "2023-05-26T18:00:00.000Z",
      "amount": 1000,
      "comment": "Income",
      "tagIds": []
    }
  ],
  "currencyRates": []
}
`;
