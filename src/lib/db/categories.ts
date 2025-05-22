import client from './client';

// Get available categories
export async function getCategories() {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM categories ORDER BY name',
    });
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Get total number of categories
export async function getCategoriesCount(): Promise<number> {
  try {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM categories',
    });
    
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Error counting categories:', error);
    throw error;
  }
}
