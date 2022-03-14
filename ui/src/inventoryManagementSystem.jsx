function ProductRow(props) {
  const product = props.product;
  return (
    <tr>
      <td>{ product.name }</td>
      <td>{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price) }</td>
      <td>{ product.category }</td>
      <td><a href={ product.imageURL } target="_blank" rel="noreferrer">View</a></td>
    </tr>
  );
}

function ProductTable(props) {
  const productRows = props.products.map(product => {
    return (
      <ProductRow key={ product.id } product={ product } />
    )
  });

  return (
    <table className="bordered-table">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Price</th>
          <th>Category</th>
          <th>Image</th>
        </tr>
      </thead>
      <tbody>
        { productRows }
      </tbody>
    </table>
  );
}

class ProductAdd extends React.Component {
  constructor() {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const form = document.forms.addProduct;
    const product = {
      category: form.category.value,
      price: parseFloat(form.price.value.substring(1)),
      name: form.name.value,
      imageURL: form.imageURL.value,
    }
    this.props.createProduct(product);
    form.category.value = "Shirts";
    form.price.value = "$";
    form.name.value = "";
    form.imageURL.value = "";
  }

  render() {
    return (
      <form name="addProduct" onSubmit={ this.handleSubmit }>
        <div className="row">
          <div className="column">
            <label>Category</label>
            <select id="list" name="category">
              <option value="Shirts">Shirts</option>
              <option value="Jeans">Jeans</option>
              <option value="Jackets">Jackets</option>
              <option value="Sweaters">Sweaters</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          <div className="column">
            <label>Price Per Unit</label>
            <input type="text" className="form-input" name="price" defaultValue="$" />
          </div>
        </div>
        <div className="row">
          <div className="column">
            <label>Product Name</label>
            <input type="text" className="form-input" name="name" />
          </div>
          <div className="column">
            <label>Image URL</label>
            <input type="text" className="form-input" name="imageURL" />
          </div>
        </div>
        <div className="row">
          <div className="column">
            <button>Add Product</button>
          </div>
        </div>
      </form>
    );
  }
}

class ProductList extends React.Component {
  constructor() {
    super();
    this.state = { products: [] };
    this.createProduct = this.createProduct.bind(this);
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const query = `query {
      productList {
        id
        category
        name
        price
        imageURL
      }
    }`;

    const response = await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const body = await response.text();
    const result = JSON.parse(body);
    this.setState({ products: result.data.productList });
  }

  async createProduct(product) {
    const query = `mutation addProduct($product: ProductInputs!) {
      addProduct(product: $product) {
        id
      }
    }`;

    await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { product } })
    });

    await this.loadData();
  }

  render() {
    return (
      <React.Fragment>
        <h1>My Company Inventory</h1>
        <h2>Showing all available products</h2>
        <hr />
        <ProductTable products={ this.state.products } />
        <h2>Add a new product to inventory</h2>
        <hr />
        <ProductAdd createProduct={ this.createProduct } />
      </React.Fragment>
    );
  }
}

const element = <ProductList />;

ReactDOM.render(element, document.getElementById('root'));