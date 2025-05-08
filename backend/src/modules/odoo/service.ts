import jsonrpcLite from "jsonrpc-lite";

type Options = {
  url: string;
  dbName: string;
  username: string;
  apiKey: string;
  password: string;
};

export default class OdooModuleService {
  private options: Options;
  private uid?: number;

  constructor(options: Options) {
    this.options = options;
  }

  private async sendRequest(method: string, params: any): Promise<any> {
    const request = jsonrpcLite.request(Date.now(), method, params);
    const response = await fetch(`${this.options.url}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Odoo Error: ${response.statusText}`);
    }

    const responseData = await response.json();
    const jsonResponse = jsonrpcLite.parse(responseData);

    // Перевірка на помилку в відповіді
    if ("error" in jsonResponse) {
      const errorResponse = jsonResponse as { error: { message: string } };
      throw new Error(`Error from Odoo: ${errorResponse.error.message}`);
    }

    // Якщо результат є, повертаємо його
    if ("result" in jsonResponse) {
      return jsonResponse.result;
    }

    // Якщо результату немає
    throw new Error("Invalid response format, no result or error found.");
  }

  async login() {
    const uidResponse = await this.sendRequest("call", {
      service: "common",
      method: "authenticate",
      args: [
        this.options.dbName,
        this.options.username,
        this.options.password,
        {},
      ],
    });

    if (typeof uidResponse === "number") {
      this.uid = uidResponse;
    } else {
      throw new Error("Invalid UID response, expected a number.");
    }
  }

  async listProducts(type: string = "product.template", pagination: { offset?: number; limit?: number } = {}) {
    const ids = await this.sendRequest("call", {
      service: "object",
      method: "execute_kw",
      args: [
        this.options.dbName,
        this.uid,
        this.options.apiKey,
        type,
        "search",
        [],
        pagination,
      ],
    });

    const productSpecifications = {
      id: {},
      display_name: {},
      is_published: {},
      website_url: {},
      name: {},
      list_price: {},
      description: {},
      description_sale: {},
      qty_available: {},
      location_id: {},
      taxes_id: {},
      hs_code: {},
      allow_out_of_stock_order: {},
      is_kits: {},
      image_1920: {},
      image_1024: {},
      image_512: {},
      image_256: {},
      currency_id: {
        fields: {
          display_name: {},
        },
      },
    };

    const products = await this.sendRequest("call", {
      service: "object",
      method: "execute_kw",
      args: [
        this.options.dbName,
        this.uid,
        this.options.apiKey,
        type,
        "web_read",
        [ids],
        {
          specification: {
            ...productSpecifications,
            product_variant_ids: {
              fields: {
                ...productSpecifications,
                product_template_variant_value_ids: {
                  fields: {
                    name: {},
                    attribute_id: {
                      fields: {
                        display_name: {},
                      },
                    },
                  },
                },
                code: {},
              },
            },
            attribute_line_ids: {
              fields: {
                attribute_id: {
                  fields: {
                    display_name: {},
                  },
                },
                value_ids: {
                  fields: {
                    display_name: {},
                  },
                },
              },
            },
          },
        },
      ],
    });

    return products;
  }
}
