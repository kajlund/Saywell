import Proverb from '../models/proverb.js';

/**
 * ProverbRepository handles direct database persistence operations with MongoDB / Mongoose.
 */
export class ProverbRepository {
  /**
   * Creates a new proverb document
   * @param {Object} proverbData
   * @returns {Promise<Object>}
   */
  async create(proverbData) {
    const proverb = new Proverb(proverbData);
    return await proverb.save();
  }

  /**
   * Finds proverbs matching query conditions with pagination and sorting
   * @param {Object} query
   * @param {Object} options
   * @param {string} options.sort
   * @param {number} options.skip
   * @param {number} options.limit
   * @returns {Promise<Array>}
   */
  async find(query, { sort = '-createdAt', skip = 0, limit = 10 } = {}) {
    return await Proverb.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  /**
   * Counts total documents matching query conditions
   * @param {Object} query
   * @returns {Promise<number>}
   */
  async count(query) {
    return await Proverb.countDocuments(query);
  }

  /**
   * Finds a single proverb by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Proverb.findById(id);
  }

  /**
   * Finds a random proverb matching query conditions
   * @param {Object} query
   * @returns {Promise<Object|null>}
   */
  async findRandom(query = {}) {
    const count = await Proverb.countDocuments(query);
    if (count === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * count);
    return await Proverb.findOne(query).skip(randomIndex);
  }

  /**
   * Updates a proverb by ID
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    return await Proverb.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Returns distinct values for a given field
   * @param {string} field
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async distinct(field, query = {}) {
    return await Proverb.distinct(field, query);
  }

  /**
   * Deletes a proverb by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    return await Proverb.findByIdAndDelete(id);
  }
}

export default new ProverbRepository();