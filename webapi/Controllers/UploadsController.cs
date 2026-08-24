using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize]
public class UploadsController(UploadService uploads) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string kind)
        => Ok(await uploads.SaveAsync(file, kind));
}
