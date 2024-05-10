class APIFeatures {
    constructor(query, queryString){
      this.query = query;
      this.queryString = queryString;
    }
  
    filter(){
      const queryObj = { ...this.queryString };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach((el) => delete queryObj[el]);
      // console.log('This is queryObj:', queryObj)
  
      // 1b. Advanced filtering:
      let queryStr = JSON.stringify(queryObj);
      // regular expression will get any of this words gte... and add $
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
      // console.log('JSON.parse(queryStr):', JSON.parse(queryStr))
      
      this.query = this.query.find(JSON.parse(queryStr))
  
      return this; // this is the entire obj
    }
  
    sort(){
      if(this.queryString.sort){
        // console.log('this is req.query.sort:', this.queryString.sort)
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy)
      }else{
        this.query = this.query.sort('-createdAt')
      }
      return this;
    }
  
    limitFields(){
       // 3 Field limiting
       if(this.queryString.fields){
        const fields = this.queryString.fields.split(',').join(' ');
        // query = query.select('name duration price')
        this.query = this.query.select(fields)
      }else{
        // removes the mongoose introduced field so the client wont see it
        this.query = this.query.select('-__v')
      }
      return this;
    }
  
    paginate(){
      const page = this.queryString.page * 1 || 1; // converts string to number
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
      
      this.query = this.query.skip(skip).limit(limit);
  
      return this;
    }
  }

  module.exports = APIFeatures;