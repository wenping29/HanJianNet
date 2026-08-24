using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

public class RevisionService(AppDbContext db)
{
    public async Task<List<RevisionDto>> ListAsync(string? status)
    {
        var q = db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .Include(r => r.Traitor)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(r => r.Status == status);
        var items = await q.OrderByDescending(r => r.SubmittedAt).ToListAsync();
        return items.Select(r => r.ToDto()).ToList();
    }

    public async Task<RevisionDto> GetAsync(string id)
    {
        var r = await db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .Include(r => r.Traitor)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ApiException(404, "修订不存在");
        return r.ToDto();
    }

    public async Task<RevisionStatusStats> StatusStatsAsync()
    {
        var grouped = await db.Revisions
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);
        int Get(string s) => grouped.TryGetValue(s, out var c) ? c : 0;
        return new RevisionStatusStats(
            Pending: Get("pending"),
            Approved: Get("approved"),
            Rejected: Get("rejected"),
            Total: grouped.Values.Sum());
    }

    public async Task<RevisionDto> ReviewAsync(string id, string reviewerId, string result, string? comment)
    {
        if (result != "approved" && result != "rejected")
            throw new ApiException(400, "审核结果仅支持 approved 或 rejected");

        var r = await db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .Include(r => r.Traitor)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ApiException(404, "修订不存在");
        if (r.Status != "pending") throw new ApiException(400, "该修订已审核");

        if (result == "approved")
        {
            var snap = JsonSerializer.Deserialize<TraitorSnapshotDto>(r.PayloadJson, JsonOpts.Default)
                       ?? new TraitorSnapshotDto();
            if (string.IsNullOrEmpty(r.TraitorId))
            {
                var t = new Traitor();
                snap.ApplyTo(t);
                db.Traitors.Add(t);
                r.TraitorId = t.Id;
            }
            else
            {
                var t = await db.Traitors
                    .Include(t => t.Spouses)
                    .Include(t => t.Children)
                    .Include(t => t.Residences)
                    .Include(t => t.CrimeRecords)
                    .Include(t => t.LifeEvents)
                    .Include(t => t.Attachments)
                    .Include(t => t.Sources)
                    .FirstOrDefaultAsync(t => t.Id == r.TraitorId)
                    ?? throw new ApiException(404, "档案不存在");
                snap.ApplyTo(t);
            }
        }

        r.Status = result;
        r.ReviewerId = reviewerId;
        r.ReviewedAt = DateTime.UtcNow;
        r.ReviewResult = result;
        r.ReviewComment = comment;
        await db.SaveChangesAsync();
        return r.ToDto();
    }
}
