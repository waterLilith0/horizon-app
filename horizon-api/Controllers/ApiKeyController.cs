using horizon_api.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace horizon_api.Controllers
{
    [Route("api/[controller]")]
    [ApiExplorerSettings(GroupName = "internal")]
    [ApiController]
    public class ApiKeyController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<ApiKeyController> logger) : ControllerBase
    {
        // GET: api/<ApiKeyController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<ApiKeyController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<ApiKeyController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT api/<ApiKeyController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<ApiKeyController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
