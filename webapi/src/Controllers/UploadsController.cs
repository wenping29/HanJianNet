using HanJianNet.WebApi.Dtos;
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
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] UploadRequestDto request) => Ok(await uploads.SaveAsync(request.File, request.Kind));
}
