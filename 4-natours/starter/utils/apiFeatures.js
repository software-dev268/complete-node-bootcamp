// utils/apiFeatures.js

class APIFeatures {
  constructor(queryString) {
    this.queryString = queryString;
    console.log('API Features', JSON.stringify(this.queryString));
    this.prismaOptions = {};
  }


  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    const where = {};
    for (const [key, value] of Object.entries(queryObj)) {
      const match = key.match(/(.+)\[(gte|gt|lte|lt)\]/);
      if (match) {
        const field = match[1];
        const operator = match[2];
        if (!where[field]) where[field] = {};
        where[field][operator] = isNaN(value) ? value : Number(value);
      } else {
        where[key] = isNaN(value) ? value : Number(value);
      }
    }

    this.prismaOptions.where = where;
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const orderBy = this.queryString.sort.split(',').map(field => {
        if (field.startsWith('-')) return { [field.substring(1)]: 'desc' };
        return { [field]: 'asc' };
      });
      this.prismaOptions.orderBy = orderBy;
    } else {
      this.prismaOptions.orderBy = [{ id: 'asc' }];
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').map(f => f.trim());
      this.prismaOptions.select = Object.fromEntries(fields.map(f => [f, true]));
    }
    return this;
  }


  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 100;
    const skip = (page - 1) * limit;

    this.prismaOptions.skip = skip;
    this.prismaOptions.take = limit;

    return this;
  }
}

module.exports = APIFeatures;