require 'spec_helper'
require_relative '../lib/review_validator'

RSpec.describe ReviewValidator do
  describe '.validate_content' do
    it 'validates valid content' do
      content = "This is a valid medical review with sufficient length for testing."
      result = ReviewValidator.validate_content(content)
      
      expect(result[:valid]).to be true
      expect(result[:errors]).to be_empty
    end

    it 'rejects empty content' do
      result = ReviewValidator.validate_content("")
      
      expect(result[:valid]).to be false
      expect(result[:errors]).to include("Content cannot be empty")
    end

    it 'rejects nil content' do
      result = ReviewValidator.validate_content(nil)
      
      expect(result[:valid]).to be false
      expect(result[:errors]).to include("Content cannot be empty")
    end

    it 'rejects content that is too short' do
      result = ReviewValidator.validate_content("Too short")
      
      expect(result[:valid]).to be false
      expect(result[:errors]).to include("Content is too short")
    end

    it 'rejects content that is too long' do
      long_content = "a" * 5001
      result = ReviewValidator.validate_content(long_content)
      
      expect(result[:valid]).to be false
      expect(result[:errors]).to include("Content is too long")
    end
  end

  describe '.sanitize_html' do
    it 'removes script tags' do
      dirty_html = '<p>Safe content</p><script>alert("xss")</script>'
      clean_html = ReviewValidator.sanitize_html(dirty_html)
      
      expect(clean_html).to eq('<p>Safe content</p>')
      expect(clean_html).not_to include('<script>')
    end

    it 'removes iframe tags' do
      dirty_html = '<p>Content</p><iframe src="evil.com"></iframe>'
      clean_html = ReviewValidator.sanitize_html(dirty_html)
      
      expect(clean_html).to eq('<p>Content</p>')
      expect(clean_html).not_to include('<iframe>')
    end

    it 'removes javascript: URLs' do
      dirty_html = '<a href="javascript:alert(1)">Link</a>'
      clean_html = ReviewValidator.sanitize_html(dirty_html)
      
      expect(clean_html).to eq('<a href="">Link</a>')
      expect(clean_html).not_to include('javascript:')
    end

    it 'removes event handlers' do
      dirty_html = '<div onclick="alert(1)">Content</div>'
      clean_html = ReviewValidator.sanitize_html(dirty_html)
      
      expect(clean_html).to eq('<div>Content</div>')
      expect(clean_html).not_to include('onclick=')
    end

    it 'handles nil input' do
      result = ReviewValidator.sanitize_html(nil)
      expect(result).to eq("")
    end
  end

  describe '.extract_medical_terms' do
    it 'extracts common medical terms' do
      content = "Patient shows improvement with current medication and therapy regimen."
      terms = ReviewValidator.extract_medical_terms(content)
      
      expect(terms).to include('patient', 'medication', 'therapy')
      expect(terms).to be_an(Array)
    end

    it 'extracts symptoms and conditions' do
      content = "The patient's symptoms include fever and the condition is improving."
      terms = ReviewValidator.extract_medical_terms(content)
      
      expect(terms).to include('symptoms', 'condition')
    end

    it 'extracts dosage units' do
      content = "Prescribed 50mg tablets, 2ml injection, 3 units daily."
      terms = ReviewValidator.extract_medical_terms(content)
      
      expect(terms).to include('mg', 'ml', 'units')
    end

    it 'returns unique terms only' do
      content = "Patient patient Patient shows symptoms symptoms"
      terms = ReviewValidator.extract_medical_terms(content)
      
      expect(terms.count('patient')).to eq(1)
      expect(terms.count('symptoms')).to eq(1)
    end

    it 'handles empty content' do
      expect(ReviewValidator.extract_medical_terms("")).to eq([])
      expect(ReviewValidator.extract_medical_terms(nil)).to eq([])
    end

    it 'is case insensitive' do
      content = "PATIENT shows SYMPTOMS with MEDICATION"
      terms = ReviewValidator.extract_medical_terms(content)
      
      expect(terms).to include('patient', 'symptoms', 'medication')
    end
  end
end