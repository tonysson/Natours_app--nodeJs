class APIfeatures {

    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {

        //1)filtering
        const queryObj = { ...this.queryString }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el]);

        //2 advenced query

        let queryStr = JSON.stringify(queryObj);
        /**
         * express gère les greather than or less than par un $gte
         * L'idée c'est de le personaliser par gt ou lt pour avoir o final $gt, $lt
         * 
         */
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        this.query = this.query.find(JSON.parse(queryStr));

        return this;

    }

    sort() {

        // 3) Sorting
        if (this.queryString.sort) {
            //const sortBy = req.query.sort.splite(',').join(' ')
            this.query = this.query.sort(this.queryString.sort)
        } else {
            this.query = this.query.sort('-createdAt')
        }
        return this
    }

    limitFields() {

        // 4-filtering by fields

        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join('')
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    pagination() {

        // Pagination

        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit);

        // on gere le cas ou le client demande une page qui n'existe pas

        // if (this.queryString.page) {
        //   const numberTours = await Tour.countDocuments();
        //   if (skip >= numberTours) throw new Error('This page does not exist')
        // }

        return this;

    }
}

module.exports = APIfeatures;