using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Entities;

namespace HanJianNet.WebApi.Dtos;

public static class Mappings
{
    public static UserDto ToDto(this User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Email = u.Email,
        Role = u.Role,
        CreatedAt = u.CreatedAt,
    };

    public static UserBriefDto ToBrief(this User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
    };

    public static TraitorSummaryDto ToSummary(this Traitor t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Period = t.Period,
        Faction = t.Faction,
        BirthYear = t.BirthYear,
        DeathYear = t.DeathYear,
        BirthYearType = t.BirthYearType,
        DeathYearType = t.DeathYearType,
        NativePlace = t.NativePlace,
        Province = t.Province ?? "",
        IdentityTags = DeserializeList(t.IdentityTagsJson),
        PhotoUrl = t.Attachments.FirstOrDefault(a => a.Kind == "photo")?.Url,
    };

    public static TraitorDto ToDto(this Traitor t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        CourtesyName = t.CourtesyName,
        Pseudonym = t.Pseudonym,
        BirthYear = t.BirthYear,
        DeathYear = t.DeathYear,
        BirthYearType = t.BirthYearType,
        DeathYearType = t.DeathYearType,
        NativePlace = t.NativePlace,
        Province = t.Province ?? "",
        Aliases = DeserializeList(t.AliasesJson),
        IdentityTags = DeserializeList(t.IdentityTagsJson),
        Period = t.Period,
        Faction = t.Faction,
        Summary = t.Summary,
        Spouses = t.Spouses.Select(s => new SpouseInputDto
        {
            Name = s.Name,
            Remark = s.Remark,
        }).ToList(),
        Children = t.Children.Select(c => new ChildInputDto
        {
            Name = c.Name,
            Gender = c.Gender,
            Whereabouts = c.Whereabouts,
            Remark = c.Remark,
        }).ToList(),
        Residences = t.Residences.Select(r => new ResidenceInputDto
        {
            Place = r.Place,
            Period = r.Period,
            Remark = r.Remark,
        }).ToList(),
        CrimeRecords = t.CrimeRecords.Select(c => new CrimeRecordInputDto
        {
            Year = c.Year,
            Title = c.Title,
            Process = c.Process,
            Harm = c.Harm,
            SourceRef = c.SourceRef,
        }).ToList(),
        Attachments = t.Attachments.Select(a => new AttachmentInputDto
        {
            Id = a.Id,
            Url = a.Url,
            Kind = a.Kind,
            FileType = a.FileType,
            Caption = a.Caption,
        }).ToList(),
        Sources = t.Sources.Select(s => new SourceInputDto
        {
            Citation = s.Citation,
            Credibility = s.Credibility,
        }).ToList(),
        LifeEvents = t.LifeEvents.Select(e => new LifeEventInputDto
        {
            Year = e.Year,
            Event = e.Event,
            SourceRef = e.SourceRef,
        }).ToList(),
        RelatedIds = DeserializeList(t.RelatedIdsJson),
    };

    public static TraitorSnapshotDto ToSnapshot(this TraitorInputDto i) => new()
    {
        Name = (i.Name ?? "").Trim(),
        CourtesyName = NullIfEmpty(i.CourtesyName),
        Pseudonym = NullIfEmpty(i.Pseudonym),
        BirthYear = i.BirthYear,
        DeathYear = i.DeathYear,
        BirthYearType = (i.BirthYearType ?? "").Trim(),
        DeathYearType = (i.DeathYearType ?? "").Trim(),
        NativePlace = (i.NativePlace ?? "").Trim(),
        Province = (i.Province ?? "").Trim(),
        Aliases = (i.Aliases ?? [])
            .Select(x => (x ?? "").Trim())
            .Where(x => x.Length > 0)
            .ToList(),
        IdentityTags = (i.IdentityTags ?? [])
            .Select(x => (x ?? "").Trim())
            .Where(x => x.Length > 0)
            .ToList(),
        Period = (i.Period ?? "").Trim(),
        Faction = (i.Faction ?? "").Trim(),
        Summary = i.Summary ?? "",
        Spouses = (i.Spouses ?? [])
            .Where(s => !string.IsNullOrWhiteSpace(s.Name))
            .Select(s => new SpouseInputDto
            {
                Name = s.Name.Trim(),
                Remark = NullIfEmpty(s.Remark),
            }).ToList(),
        Children = (i.Children ?? [])
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .Select(c => new ChildInputDto
            {
                Name = c.Name.Trim(),
                Gender = NullIfEmpty(c.Gender),
                Whereabouts = NullIfEmpty(c.Whereabouts),
                Remark = NullIfEmpty(c.Remark),
            }).ToList(),
        Residences = (i.Residences ?? [])
            .Where(r => !string.IsNullOrWhiteSpace(r.Place))
            .Select(r => new ResidenceInputDto
            {
                Place = r.Place.Trim(),
                Period = NullIfEmpty(r.Period),
                Remark = NullIfEmpty(r.Remark),
            }).ToList(),
        CrimeRecords = (i.CrimeRecords ?? [])
            .Where(c => !string.IsNullOrWhiteSpace(c.Title))
            .Select(c => new CrimeRecordInputDto
            {
                Year = c.Year,
                Title = c.Title.Trim(),
                Process = NullIfEmpty(c.Process),
                Harm = NullIfEmpty(c.Harm),
                SourceRef = NullIfEmpty(c.SourceRef),
            }).ToList(),
        Attachments = (i.Attachments ?? [])
            .Where(a => !string.IsNullOrWhiteSpace(a.Url))
            .Select(a => new AttachmentInputDto
            {
                Id = a.Id,
                Url = a.Url.Trim(),
                Kind = (a.Kind ?? "").Trim(),
                FileType = (a.FileType ?? "").Trim(),
                Caption = NullIfEmpty(a.Caption),
            }).ToList(),
        Sources = (i.Sources ?? [])
            .Where(s => !string.IsNullOrWhiteSpace(s.Citation))
            .Select(s => new SourceInputDto
            {
                Citation = s.Citation.Trim(),
                Credibility = s.Credibility,
            }).ToList(),
        LifeEvents = (i.LifeEvents ?? [])
            .Where(e => !string.IsNullOrWhiteSpace(e.Event))
            .Select(e => new LifeEventInputDto
            {
                Year = e.Year,
                Event = e.Event.Trim(),
                SourceRef = NullIfEmpty(e.SourceRef),
            }).ToList(),
        RelatedIds = (i.RelatedIds ?? [])
            .Select(x => (x ?? "").Trim())
            .Where(x => x.Length > 0)
            .ToList(),
    };

    public static void ApplyTo(this TraitorSnapshotDto s, Traitor t)
    {
        t.Name = s.Name;
        t.CourtesyName = s.CourtesyName;
        t.Pseudonym = s.Pseudonym;
        t.BirthYear = s.BirthYear;
        t.DeathYear = s.DeathYear;
        t.BirthYearType = s.BirthYearType;
        t.DeathYearType = s.DeathYearType;
        t.NativePlace = s.NativePlace;
        t.Province = s.Province;
        t.AliasesJson = JsonSerializer.Serialize(s.Aliases, JsonOpts.Default);
        t.IdentityTagsJson = JsonSerializer.Serialize(s.IdentityTags, JsonOpts.Default);
        t.Period = s.Period;
        t.Faction = s.Faction;
        t.Summary = s.Summary;
        t.RelatedIdsJson = JsonSerializer.Serialize(s.RelatedIds, JsonOpts.Default);
        t.Spouses = s.Spouses.Select(x => new Spouse
        {
            Name = x.Name,
            Remark = x.Remark,
        }).ToList();
        t.Children = s.Children.Select(x => new Child
        {
            Name = x.Name,
            Gender = x.Gender,
            Whereabouts = x.Whereabouts,
            Remark = x.Remark,
        }).ToList();
        t.Residences = s.Residences.Select(x => new Residence
        {
            Place = x.Place,
            Period = x.Period,
            Remark = x.Remark,
        }).ToList();
        t.CrimeRecords = s.CrimeRecords.Select(x => new CrimeRecord
        {
            Year = x.Year,
            Title = x.Title,
            Process = x.Process,
            Harm = x.Harm,
            SourceRef = x.SourceRef,
        }).ToList();
        t.Attachments = s.Attachments.Select(x => new Attachment
        {
            Id = x.Id,
            Url = x.Url,
            Kind = x.Kind,
            FileType = x.FileType,
            Caption = x.Caption,
        }).ToList();
        t.Sources = s.Sources.Select(x => new SourceRef
        {
            Citation = x.Citation,
            Credibility = x.Credibility,
        }).ToList();
        t.LifeEvents = s.LifeEvents.Select(x => new LifeEvent
        {
            Year = x.Year,
            Event = x.Event,
            SourceRef = x.SourceRef,
        }).ToList();
    }

    public static RevisionDto ToDto(this Revision r)
    {
        var snapshot = JsonSerializer.Deserialize<TraitorSnapshotDto>(r.PayloadJson, JsonOpts.Default)
                       ?? new TraitorSnapshotDto();
        return new RevisionDto
        {
            Id = r.Id,
            TraitorId = r.TraitorId,
            SubmitterId = r.SubmitterId,
            Submitter = r.Submitter?.ToBrief(),
            SubmittedAt = r.SubmittedAt,
            ChangeSummary = r.ChangeSummary,
            Payload = ToTraitorDto(snapshot, r.TraitorId ?? ""),
            Status = r.Status,
            ReviewerId = r.ReviewerId,
            Reviewer = r.Reviewer?.ToBrief(),
            ReviewedAt = r.ReviewedAt,
            ReviewResult = r.ReviewResult,
            ReviewComment = r.ReviewComment,
        };
    }

    private static TraitorDto ToTraitorDto(this TraitorSnapshotDto s, string id) => new()
    {
        Id = id,
        Name = s.Name,
        CourtesyName = s.CourtesyName,
        Pseudonym = s.Pseudonym,
        BirthYear = s.BirthYear,
        DeathYear = s.DeathYear,
        BirthYearType = s.BirthYearType,
        DeathYearType = s.DeathYearType,
        NativePlace = s.NativePlace,
        Province = s.Province,
        Aliases = s.Aliases,
        IdentityTags = s.IdentityTags,
        Period = s.Period,
        Faction = s.Faction,
        Summary = s.Summary,
        Spouses = s.Spouses,
        Children = s.Children,
        Residences = s.Residences,
        CrimeRecords = s.CrimeRecords,
        Attachments = s.Attachments,
        Sources = s.Sources,
        LifeEvents = s.LifeEvents,
        RelatedIds = s.RelatedIds,
    };

    private static List<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOpts.Default) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
