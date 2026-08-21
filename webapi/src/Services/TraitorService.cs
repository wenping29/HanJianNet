using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

public class TraitorService(AppDbContext db)
{
    public async Task<List<TraitorSummaryDto>> SearchAsync(TraitorFilter filter)
    {
        var query = db.Traitors.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            var name = filter.Name.Trim();
            query = query.Where(t =>
                t.Name.Contains(name) ||
                (t.CourtesyName != null && t.CourtesyName.Contains(name)) ||
                (t.Pseudonym != null && t.Pseudonym.Contains(name)) ||
                t.AliasesJson.Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(filter.Period))
            query = query.Where(t => t.Period == filter.Period);

        if (filter.YearFrom.HasValue)
            query = query.Where(t => t.DeathYear == null || t.DeathYear >= filter.YearFrom);

        if (filter.YearTo.HasValue)
            query = query.Where(t => t.BirthYear == null || t.BirthYear <= filter.YearTo);

        if (!string.IsNullOrWhiteSpace(filter.Event))
        {
            var ev = filter.Event.Trim();
            query = query.Where(t =>
                t.CrimeRecords.Any(c =>
                    c.Title.Contains(ev) ||
                    (c.Process != null && c.Process.Contains(ev)) ||
                    (c.Harm != null && c.Harm.Contains(ev))) ||
                t.LifeEvents.Any(l => l.Event.Contains(ev)));
        }

        var list = await query
            .OrderByDescending(t => t.PublishedAt)
            .ToListAsync();

        return list.Select(t => t.ToSummary()).ToList();
    }

    public async Task<TraitorDto> GetByIdAsync(string id)
    {
        var traitor = await IncludeAll(db.Traitors).FirstOrDefaultAsync(t => t.Id == id);
        if (traitor is null) throw new ApiException(404, "档案不存在");
        return traitor.ToDto();
    }

    public async Task<List<RevisionDto>> GetPublicRevisionsAsync(string traitorId)
    {
        var revisions = await db.Revisions
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .Where(r => r.TraitorId == traitorId && r.Status != "pending")
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();
        return revisions.Select(r => r.ToDto()).ToList();
    }

    public async Task<StatsDto> GetStatsAsync()
    {
        return new StatsDto
        {
            Total = await db.Traitors.CountAsync(),
            Sentenced = await db.Traitors.CountAsync(t => t.CrimeRecords.Any()),
            ChildrenInfo = await db.Children.CountAsync(),
            DescendantsStatus = await db.Children.CountAsync(c => c.Whereabouts != null && c.Whereabouts != ""),
        };
    }

    public async Task<List<TimelineNodeDto>> GetTimelineAsync()
    {
        var lifeNodes = await db.LifeEvents
            .Include(l => l.Traitor)
            .Select(l => new TimelineNodeDto
            {
                Id = l.Id,
                Year = l.Year,
                Event = l.Event,
                TraitorId = l.TraitorId,
                TraitorName = l.Traitor != null ? l.Traitor.Name : null,
            })
            .ToListAsync();

        var crimeNodes = await db.CrimeRecords
            .Include(c => c.Traitor)
            .Select(c => new TimelineNodeDto
            {
                Id = c.Id,
                Year = c.Year,
                Event = c.Title,
                TraitorId = c.TraitorId,
                TraitorName = c.Traitor != null ? c.Traitor.Name : null,
            })
            .ToListAsync();

        return lifeNodes.Concat(crimeNodes)
            .OrderBy(n => n.Year ?? int.MaxValue)
            .Take(100)
            .ToList();
    }

    public async Task<string> SubmitNewAsync(string userId, TraitorInputDto input)
    {
        Validate(input);
        var revision = new Revision
        {
            SubmitterId = userId,
            ChangeSummary = input.ChangeSummary.Trim(),
            PayloadJson = SerializeSnapshot(input.ToSnapshot()),
            Status = "pending",
        };
        db.Revisions.Add(revision);
        await db.SaveChangesAsync();
        return revision.Id;
    }

    public async Task<string> SubmitEditAsync(string userId, string traitorId, TraitorInputDto input)
    {
        if (!await db.Traitors.AnyAsync(t => t.Id == traitorId))
            throw new ApiException(404, "档案不存在");

        Validate(input);
        var revision = new Revision
        {
            TraitorId = traitorId,
            SubmitterId = userId,
            ChangeSummary = input.ChangeSummary.Trim(),
            PayloadJson = SerializeSnapshot(input.ToSnapshot()),
            Status = "pending",
        };
        db.Revisions.Add(revision);
        await db.SaveChangesAsync();
        return revision.Id;
    }

    private static void Validate(TraitorInputDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name)) throw new ApiException(400, "姓名不能为空");
        if (string.IsNullOrWhiteSpace(input.Summary)) throw new ApiException(400, "人物概述不能为空");
        if (string.IsNullOrWhiteSpace(input.ChangeSummary)) throw new ApiException(400, "修改内容摘要不能为空");
    }

    private static string SerializeSnapshot(TraitorSnapshotDto snapshot) =>
        System.Text.Json.JsonSerializer.Serialize(snapshot, JsonOpts.Default);

    internal static IQueryable<Traitor> IncludeAll(IQueryable<Traitor> query) =>
        query.Include(t => t.Spouses)
            .Include(t => t.Children)
            .Include(t => t.Residences)
            .Include(t => t.CrimeRecords)
            .Include(t => t.Attachments)
            .Include(t => t.Sources)
            .Include(t => t.LifeEvents);
}
