using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

public class RevisionService(AppDbContext db)
{
    public async Task<List<RevisionDto>> MySubmissionsAsync(string userId)
    {
        var revisions = await db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .Where(r => r.SubmitterId == userId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();
        return revisions.Select(r => r.ToDto()).ToList();
    }

    public async Task<List<RevisionDto>> AdminListAsync(string? status)
    {
        var query = db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        var revisions = await query.OrderByDescending(r => r.SubmittedAt).ToListAsync();
        return revisions.Select(r => r.ToDto()).ToList();
    }

    public async Task<RevisionDto> AdminGetAsync(string id)
    {
        var revision = await FindWithUsers(id);
        if (revision is null) throw new ApiException(404, "审核记录不存在");
        return revision.ToDto();
    }

    public async Task<RevisionDto> ReviewAsync(string reviewerId, string id, ReviewRequest req)
    {
        var result = req.Result.Trim().ToLowerInvariant();
        if (result is not ("approved" or "rejected"))
            throw new ApiException(400, "result 必须为 approved 或 rejected");

        var revision = await FindWithUsers(id);
        if (revision is null) throw new ApiException(404, "审核记录不存在");
        if (revision.Status != "pending") throw new ApiException(409, "该提交已审核");

        revision.Status = result;
        revision.ReviewResult = result;
        revision.ReviewerId = reviewerId;
        revision.ReviewedAt = DateTime.UtcNow;
        revision.ReviewComment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim();

        if (result == "approved")
            await ApplyPayloadAsync(revision);

        await db.SaveChangesAsync();
        return revision.ToDto();
    }

    private async Task ApplyPayloadAsync(Revision revision)
    {
        TraitorSnapshotDto snapshot;
        try
        {
            snapshot = JsonSerializer.Deserialize<TraitorSnapshotDto>(revision.PayloadJson, JsonOpts.Default)
                       ?? throw new ApiException(500, "提交内容快照解析失败");
        }
        catch (JsonException)
        {
            throw new ApiException(500, "提交内容快照解析失败");
        }

        Traitor traitor;
        if (revision.TraitorId is null)
        {
            traitor = new Traitor { PublishedAt = DateTime.UtcNow };
            db.Traitors.Add(traitor);
            revision.TraitorId = traitor.Id;
        }
        else
        {
            traitor = await TraitorService.IncludeAll(db.Traitors)
                          .FirstOrDefaultAsync(t => t.Id == revision.TraitorId)
                      ?? throw new ApiException(404, "原档案已被删除，无法通过该修订");
        }

        snapshot.ApplyTo(traitor);

        traitor.Spouses.Clear();
        traitor.Children.Clear();
        traitor.Residences.Clear();
        traitor.CrimeRecords.Clear();
        traitor.Attachments.Clear();
        traitor.Sources.Clear();
        traitor.LifeEvents.Clear();

        foreach (var s in snapshot.Spouses)
            traitor.Spouses.Add(new Spouse { Name = s.Name, Remark = s.Remark });
        foreach (var c in snapshot.Children)
            traitor.Children.Add(new Child
            {
                Name = c.Name,
                Gender = c.Gender,
                Whereabouts = c.Whereabouts,
                Remark = c.Remark,
            });
        foreach (var r in snapshot.Residences)
            traitor.Residences.Add(new Residence { Place = r.Place, Period = r.Period, Remark = r.Remark });
        foreach (var c in snapshot.CrimeRecords)
            traitor.CrimeRecords.Add(new CrimeRecord
            {
                Year = c.Year,
                Title = c.Title,
                Process = c.Process,
                Harm = c.Harm,
                SourceRef = c.SourceRef,
            });
        foreach (var a in snapshot.Attachments)
            traitor.Attachments.Add(new Attachment
            {
                Id = string.IsNullOrWhiteSpace(a.Id) ? Guid.NewGuid().ToString("N") : a.Id,
                Url = a.Url,
                Kind = a.Kind,
                FileType = a.FileType,
                Caption = a.Caption,
            });
        foreach (var s in snapshot.Sources)
            traitor.Sources.Add(new SourceRef { Citation = s.Citation, Credibility = s.Credibility });
        foreach (var l in snapshot.LifeEvents)
            traitor.LifeEvents.Add(new LifeEvent
            {
                Year = l.Year,
                Event = l.Event,
                SourceRef = l.SourceRef,
            });
    }

    private Task<Revision?> FindWithUsers(string id) =>
        db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .FirstOrDefaultAsync(r => r.Id == id);
}
