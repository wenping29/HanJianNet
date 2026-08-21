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

    public static UserBriefDto ToBrief(this User u) => new() { Id = u.Id, Username = u.Username };

    public static TraitorSummaryDto ToSummary(this Traitor t)
    {
        var photo = t.Attachments.FirstOrDefault(a => a.Kind == "photo");
        return new TraitorSummaryDto
        {
            Id = t.Id,
            Name = t.Name,
            Period = t.Period,
            Faction = t.Faction,
            BirthYear = t.BirthYear,
            DeathYear = t.DeathYear,
            BirthYearType = t.BirthYearType,
            DeathYearType = t.DeathYearType,
            IdentityTags = DeserializeList(t.IdentityTagsJson),
            PhotoUrl = photo?.Url,
        };
    }

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
        Aliases = DeserializeList(t.AliasesJson),
        IdentityTags = DeserializeList(t.IdentityTagsJson),
        Period = t.Period,
        Faction = t.Faction,
        Summary = t.Summary,
        Spouses = t.Spouses.Select(s => new SpouseInputDto { Name = s.Name, Remark = s.Remark }).ToList(),
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
        Sources = t.Sources.Select(s => new SourceInputDto { Citation = s.Citation, Credibility = s.Credibility }).ToList(),
        LifeEvents = t.LifeEvents.Select(l => new LifeEventInputDto
        {
            Year = l.Year,
            Event = l.Event,
            SourceRef = l.SourceRef,
        }).ToList(),
        RelatedIds = DeserializeList(t.RelatedIdsJson),
    };

    public static TraitorSnapshotDto ToSnapshot(this TraitorInputDto i) => new()
    {
        Name = i.Name.Trim(),
        CourtesyName = NullIfEmpty(i.CourtesyName),
        Pseudonym = NullIfEmpty(i.Pseudonym),
        BirthYear = i.BirthYear,
        DeathYear = i.DeathYear,
        BirthYearType = i.BirthYearType,
        DeathYearType = i.DeathYearType,
        NativePlace = i.NativePlace.Trim(),
        Aliases = i.Aliases,
        IdentityTags = i.IdentityTags,
        Period = i.Period,
        Faction = i.Faction.Trim(),
        Summary = i.Summary.Trim(),
        Spouses = i.Spouses.Where(s => !string.IsNullOrWhiteSpace(s.Name)).ToList(),
        Children = i.Children.Where(c => !string.IsNullOrWhiteSpace(c.Name)).ToList(),
        Residences = i.Residences.Where(r => !string.IsNullOrWhiteSpace(r.Place)).ToList(),
        CrimeRecords = i.CrimeRecords.Where(c => !string.IsNullOrWhiteSpace(c.Title)).ToList(),
        Attachments = i.Attachments,
        Sources = i.Sources.Where(s => !string.IsNullOrWhiteSpace(s.Citation)).ToList(),
        LifeEvents = i.LifeEvents.Where(l => !string.IsNullOrWhiteSpace(l.Event)).ToList(),
        RelatedIds = i.RelatedIds,
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
        t.AliasesJson = JsonSerializer.Serialize(s.Aliases, JsonOpts.Default);
        t.IdentityTagsJson = JsonSerializer.Serialize(s.IdentityTags, JsonOpts.Default);
        t.Period = s.Period;
        t.Faction = s.Faction;
        t.Summary = s.Summary;
        t.RelatedIdsJson = JsonSerializer.Serialize(s.RelatedIds, JsonOpts.Default);
    }

    public static RevisionDto ToDto(this Revision r)
    {
        TraitorSnapshotDto? snapshot;
        try
        {
            snapshot = JsonSerializer.Deserialize<TraitorSnapshotDto>(r.PayloadJson, JsonOpts.Default);
        }
        catch
        {
            snapshot = null;
        }
        var payload = snapshot?.ToTraitorDto(r.TraitorId ?? "") ?? new TraitorDto();

        return new RevisionDto
        {
            Id = r.Id,
            TraitorId = r.TraitorId,
            SubmitterId = r.SubmitterId,
            Submitter = r.Submitter?.ToBrief(),
            SubmittedAt = r.SubmittedAt,
            ChangeSummary = r.ChangeSummary,
            Payload = payload,
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

    private static List<string> DeserializeList(string json)
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
